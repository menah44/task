import { AppDataSource } from './src/data-source';
import { Form } from './src/forms/entities/form.entity';

async function listAll() {
  await AppDataSource.initialize();
  const forms = await AppDataSource.getRepository(Form).find({
    relations: ['sections', 'sections.questions']
  });

  console.log('--- ALL FORMS IN DB ---');
  console.log('Total forms:', forms.length);
  forms.forEach(form => {
    console.log(`ID: ${form.id}, Title: "${form.title}", Status: "${form.status}", OrgID: ${form.organizationId}, Sections: ${form.sections?.length}`);
    form.sections?.forEach(sec => {
      console.log(`  Section ID: ${sec.id}, Title: "${sec.title}", Questions: ${sec.questions?.length}`);
      sec.questions?.forEach(q => {
        console.log(`    Question ID: ${q.id}, Type: "${q.type}", Label: "${q.label}"`);
      });
    });
  });
  process.exit(0);
}

listAll().catch(console.error);
