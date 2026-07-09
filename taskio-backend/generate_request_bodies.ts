// @ts-nocheck
import { Project, ClassDeclaration, PropertyDeclaration } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

function getEndpoints() {
  const endpoints = [];
  const controllers = project.getSourceFiles().flatMap(sf => sf.getClasses()).filter(c => c.getDecorator('Controller'));
  
  for (const controller of controllers) {
    const controllerName = controller.getName() || 'UnknownController';
    const controllerRoute = getRoute(controller.getDecorator('Controller'));
    
    for (const method of controller.getMethods()) {
      for (const methodDecorator of ['Post', 'Put', 'Patch']) {
        const dec = method.getDecorator(methodDecorator);
        if (dec) {
          const methodRoute = getRoute(dec);
          const fullRoute = `/api/v1/${controllerRoute}${methodRoute ? '/' + methodRoute : ''}`.replace(/\/+/g, '/');
          const bodyParam = method.getParameters().find(p => p.getDecorator('Body'));
          
          endpoints.push({
            method: methodDecorator.toUpperCase(),
            path: fullRoute,
            controller: controllerName,
            methodName: method.getName(),
            dtoType: bodyParam ? bodyParam.getType().getSymbol()?.getName() || bodyParam.getType().getText() : 'None',
            dtoClass: bodyParam ? getDtoClass(bodyParam.getType().getSymbol()?.getDeclarations()[0]) : null
          });
        }
      }
    }
  }
  return endpoints;
}

function getRoute(decorator) {
  if (!decorator) return '';
  const args = decorator.getArguments();
  if (args.length === 0) return '';
  return args[0].getText().replace(/['"]/g, '');
}

function getDtoClass(declaration) {
  if (!declaration) return null;
  if (declaration.getKindName() === 'ClassDeclaration') {
    return declaration as ClassDeclaration;
  }
  return null;
}

function parseDto(dtoClass) {
  if (!dtoClass) return [];
  
  const properties = [];
  
  // also get inherited properties
  const baseClass = dtoClass.getBaseClass();
  if (baseClass) {
    properties.push(...parseDto(baseClass));
  }
  
  for (const prop of dtoClass.getProperties()) {
    const propInfo = {
      name: prop.getName(),
      type: prop.getType().getText(),
      decorators: prop.getDecorators().map(d => d.getName()),
      isRequired: !prop.hasQuestionToken(),
      example: 'example'
    };
    
    // adjust isRequired based on class-validator
    if (propInfo.decorators.includes('IsOptional')) {
      propInfo.isRequired = false;
    }
    if (propInfo.decorators.includes('IsNotEmpty') || propInfo.decorators.includes('IsString') || propInfo.decorators.includes('IsNumber')) {
      if (!propInfo.decorators.includes('IsOptional')) {
        propInfo.isRequired = true;
      }
    }
    
    // Generate example value
    const t = propInfo.type.toLowerCase();
    if (t.includes('string')) propInfo.example = `${propInfo.name}_string`;
    if (t.includes('number')) propInfo.example = 1;
    if (t.includes('boolean')) propInfo.example = true;
    if (t.includes('[]')) propInfo.example = [];
    if (t.includes('any') || t.includes('object')) propInfo.example = {};
    
    // UUID / Email
    if (propInfo.decorators.includes('IsUUID')) propInfo.example = '123e4567-e89b-12d3-a456-426614174000';
    if (propInfo.decorators.includes('IsEmail')) propInfo.example = 'user@example.com';
    
    // ApiProperty example extraction
    const apiProp = prop.getDecorator('ApiProperty');
    if (apiProp) {
      const args = apiProp.getArguments();
      if (args.length > 0 && args[0].getKindName() === 'ObjectLiteralExpression') {
        const obj = args[0] as any;
        const ex = obj.getProperty('example');
        if (ex) {
          const exInit = ex.getInitializer();
          if (exInit) {
            try {
              propInfo.example = JSON.parse(exInit.getText().replace(/'/g, '"'));
            } catch (e) {
              propInfo.example = exInit.getText().replace(/['"]/g, '');
            }
          }
        }
      }
    }
    
    properties.push(propInfo);
  }
  return properties;
}

function buildValidationsText(prop) {
  const rules = [];
  rules.push(prop.isRequired ? 'required' : 'optional');
  
  if (prop.decorators.includes('IsString')) rules.push('string');
  if (prop.decorators.includes('IsNumber')) rules.push('number');
  if (prop.decorators.includes('IsBoolean')) rules.push('boolean');
  if (prop.decorators.includes('IsEmail')) rules.push('valid email');
  if (prop.decorators.includes('IsUUID')) rules.push('UUID format');
  if (prop.decorators.includes('IsUrl')) rules.push('valid URL');
  if (prop.decorators.includes('IsEnum')) rules.push('enum');
  if (prop.decorators.includes('IsArray')) rules.push('array');
  
  // Custom constraints like MinLength
  if (prop.decorators.includes('MinLength')) rules.push('minimum length constraint');
  if (prop.decorators.includes('MaxLength')) rules.push('maximum length constraint');
  
  return rules.join(', ');
}

function generateMarkdown() {
  const endpoints = getEndpoints();
  let mdContent = '# Request Bodies Documentation\n\n';
  let summaryTable = '| Endpoint | DTO | Ready to Copy Body |\n| -------- | --- | ------------------ |\n';
  
  for (const ep of endpoints) {
    if (ep.dtoType === 'None' || ep.dtoType === 'any') continue;
    
    const props = parseDto(ep.dtoClass);
    
    const minBody = {};
    const compBody = {};
    const validations = [];
    
    for (const p of props) {
      compBody[p.name] = p.example;
      if (p.isRequired) {
        minBody[p.name] = p.example;
      }
      validations.push(`* **${p.name}**: ${buildValidationsText(p)}`);
    }
    
    const deps = [];
    if (ep.path.includes('organizationId') || compBody.hasOwnProperty('organizationId')) deps.push('* **organizationId**: Comes from path param or auth context.');
    if (ep.path.includes('roleId') || compBody.hasOwnProperty('roleId')) deps.push('* **roleId**: Must exist in Roles table.');
    if (ep.path.includes('formId') || compBody.hasOwnProperty('formId')) deps.push('* **formId**: Must exist in Forms table.');
    if (ep.path.includes('templateId') || compBody.hasOwnProperty('templateId')) deps.push('* **templateId**: Must exist in Templates table.');
    
    mdContent += `## ${ep.method} ${ep.path}\n\n`;
    mdContent += `**Controller**:\n\`${ep.controller}.${ep.methodName}()\`\n\n`;
    mdContent += `**DTO**:\n\`${ep.dtoType}\`\n\n`;
    
    mdContent += `### Minimum Valid Body\n\n\`\`\`json\n${JSON.stringify(minBody, null, 2)}\n\`\`\`\n\n`;
    mdContent += `### Complete Body\n\n\`\`\`json\n${JSON.stringify(compBody, null, 2)}\n\`\`\`\n\n`;
    
    mdContent += `### Validation\n\n`;
    if (validations.length > 0) {
      mdContent += validations.join('\n') + '\n\n';
    } else {
      mdContent += 'No specific validations found.\n\n';
    }
    
    if (deps.length > 0) {
      mdContent += `### Dependencies\n\n${deps.join('\n')}\n\n`;
    }
    
    mdContent += `---\n\n`;
    
    summaryTable += `| \`${ep.method} ${ep.path}\` | \`${ep.dtoType}\` | \`${JSON.stringify(compBody)}\` |\n`;
  }
  
  mdContent += `## Summary Table\n\n${summaryTable}`;
  
  const outFile = 'C:\\Users\\eslam\\.gemini\\antigravity-ide\\brain\\4d49d3e9-fa77-4cd2-9884-0b987e078443\\request-bodies.md';
  fs.writeFileSync(outFile, mdContent, 'utf-8');
  console.log('Markdown generated successfully!');
}

generateMarkdown();
