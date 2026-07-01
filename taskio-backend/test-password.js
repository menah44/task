const bcrypt = require('bcrypt');

const users = [
  {
    email: 'admin@taskio.com',
    hash: '$2a$12$h89Qk6DWa9CE6KHqw//DNuZYjWcfQ3CoifoDmUx.0GESUpi0901ja'
  },
  {
    email: 'menah55667@gmil.com',
    hash: '$2b$10$M5qzjF54n79Nzq6NtsJsJep/0uuSBotreYKpB.WdYioJ/FmrClvdi'
  },
  {
    email: 'osame@taskio.com',
    hash: '$2b$10$TX6p405qQ77osh1MPKIF0elyUjB8dJiiXQ7AysG7jay6w8k8CCjwK'
  }
];

const passwords = ['1234', '123456', '12345678', 'password', 'menah55667', 'osame', 'admin'];

async function test() {
  for (const user of users) {
    console.log(`\nTesting for user: ${user.email}`);
    for (const pw of passwords) {
      const match = await bcrypt.compare(pw, user.hash);
      if (match) {
        console.log(`  MATCH FOUND: Password is "${pw}"`);
      }
    }
  }
}

test();
