import json
import re

def resolve_ref(ref, swagger):
    parts = ref.replace('#/', '').split('/')
    current = swagger
    for part in parts:
        current = current.get(part, {})
    return current

def get_schema_name(ref):
    return ref.split('/')[-1] if ref else "Unknown"

def generate_example_value(prop_schema, prop_name):
    if 'example' in prop_schema:
        return prop_schema['example']
    if 'enum' in prop_schema:
        return prop_schema['enum'][0]
    
    t = prop_schema.get('type', 'string')
    fmt = prop_schema.get('format', '')
    
    if t == 'string':
        if fmt == 'email':
            return 'user@example.com'
        elif fmt == 'uuid':
            return '123e4567-e89b-12d3-a456-426614174000'
        elif fmt == 'date-time':
            return '2023-01-01T00:00:00Z'
        return f'{prop_name}_string'
    elif t == 'integer' or t == 'number':
        return prop_schema.get('minimum', 1)
    elif t == 'boolean':
        return True
    elif t == 'array':
        items = prop_schema.get('items', {})
        if '$ref' in items:
            return [{}]  # Simplify for complex nested objects
        return [generate_example_value(items, prop_name)]
    elif t == 'object':
        return {}
    return "example"

def get_validation_rules(prop_schema, required):
    rules = ["required" if required else "optional"]
    if 'type' in prop_schema:
        rules.append(prop_schema['type'])
    if 'format' in prop_schema:
        rules.append(f"format: {prop_schema['format']}")
    if 'minLength' in prop_schema:
        rules.append(f"min length: {prop_schema['minLength']}")
    if 'maxLength' in prop_schema:
        rules.append(f"max length: {prop_schema['maxLength']}")
    if 'minimum' in prop_schema:
        rules.append(f"min: {prop_schema['minimum']}")
    if 'maximum' in prop_schema:
        rules.append(f"max: {prop_schema['maximum']}")
    if 'enum' in prop_schema:
        rules.append(f"enum: [{', '.join(map(str, prop_schema['enum']))}]")
    
    return ", ".join(rules)

def main():
    try:
        with open('swagger.json', 'r', encoding='utf-8') as f:
            swagger = json.load(f)
    except FileNotFoundError:
        print("swagger.json not found. Please ensure the swagger file is present.")
        return

    out_file = r'C:\Users\eslam\.gemini\antigravity-ide\brain\4d49d3e9-fa77-4cd2-9884-0b987e078443\request-bodies.md'
    
    md_content = "# Request Bodies Documentation\n\n"
    summary_table = "| Endpoint | DTO | Ready to Copy Body |\n| -------- | --- | ------------------ |\n"
    
    for path, methods in swagger.get('paths', {}).items():
        for method, operation in methods.items():
            if method.lower() not in ['post', 'put', 'patch']:
                continue
            
            if 'requestBody' not in operation:
                continue
                
            content = operation['requestBody'].get('content', {})
            if 'application/json' not in content:
                continue
                
            schema_ref_obj = content['application/json'].get('schema', {})
            
            if '$ref' in schema_ref_obj:
                schema = resolve_ref(schema_ref_obj['$ref'], swagger)
                dto_name = get_schema_name(schema_ref_obj['$ref'])
            else:
                schema = schema_ref_obj
                dto_name = "Inline Schema"

            operation_id = operation.get('operationId', 'UnknownController_method')
            controller = operation_id.split('_')[0] if '_' in operation_id else 'UnknownController'
            method_name = operation_id.split('_')[1] if '_' in operation_id else operation_id
            
            properties = schema.get('properties', {})
            required_fields = schema.get('required', [])
            
            min_body = {}
            comp_body = {}
            validations = []
            
            for prop_name, prop_schema in properties.items():
                if '$ref' in prop_schema:
                    prop_schema = resolve_ref(prop_schema['$ref'], swagger)
                
                is_req = prop_name in required_fields
                val = generate_example_value(prop_schema, prop_name)
                
                comp_body[prop_name] = val
                if is_req:
                    min_body[prop_name] = val
                    
                rules = get_validation_rules(prop_schema, is_req)
                validations.append(f"* **{prop_name}**: {rules}")
            
            endpoint_title = f"{method.upper()} {path}"
            
            md_content += f"## {endpoint_title}\n\n"
            md_content += f"**Controller**:\n`{controller}.{method_name}()`\n\n"
            md_content += f"**DTO**:\n`{dto_name}`\n\n"
            
            md_content += "### Minimum Valid Body\n\n```json\n"
            md_content += json.dumps(min_body, indent=2)
            md_content += "\n```\n\n"
            
            md_content += "### Complete Body\n\n```json\n"
            md_content += json.dumps(comp_body, indent=2)
            md_content += "\n```\n\n"
            
            md_content += "### Validation\n\n"
            if validations:
                md_content += "\n".join(validations) + "\n\n"
            else:
                md_content += "No specific validations found.\n\n"
                
            dependencies = []
            if "organizationId" in path or "organizationId" in comp_body:
                dependencies.append("* **organizationId**: Extracted from the authenticated user context or path parameter.")
            if "roleId" in path or "roleId" in comp_body:
                dependencies.append("* **roleId**: Must exist in the Roles table.")
            if "templateId" in path or "templateId" in comp_body:
                dependencies.append("* **templateId**: ID of an existing form template.")
            if "formId" in path or "formId" in comp_body:
                dependencies.append("* **formId**: ID of an existing form.")
            if "userId" in path or "userId" in comp_body:
                dependencies.append("* **userId**: ID of an existing user.")
            
            if dependencies:
                md_content += "### Dependencies\n\n"
                md_content += "\n".join(dependencies) + "\n\n"

            md_content += "---\n\n"
            
            min_body_str = json.dumps(min_body).replace('"', '`')
            summary_table += f"| `{method.upper()} {path}` | `{dto_name}` | `{json.dumps(comp_body)}` |\n"
            
    md_content += "## Summary Table\n\n"
    md_content += summary_table
    
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    print("Done")

if __name__ == '__main__':
    main()
