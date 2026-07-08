import { AppDataSource } from './src/data-source';
import { Form } from './src/forms/entities/form.entity';

async function checkForm19() {
  await AppDataSource.initialize();
  const form = await AppDataSource.getRepository(Form).findOne({
    where: { id: 19 },
    relations: ['sections', 'sections.questions']
  });

  if (!form) {
    console.log('Form 19 not found in DB!');
  } else {
    console.log('--- FORM 19 DETAILS ---');
    console.log('Title:', form.title);
    console.log('Status:', form.status);
    console.log('Sections count:', form.sections?.length);
    form.sections?.forEach(sec => {
      console.log(`  Section: ${sec.title} (ID: ${sec.id})`);
      console.log(`    Questions count: ${sec.questions?.length}`);
      sec.questions?.forEach(q => {
        console.log(`      Question: ${q.label} (Type: ${q.type}, ID: ${q.id})`);
      });
    });
  }
  process.exit(0);
}

checkForm19().catch(console.error);
