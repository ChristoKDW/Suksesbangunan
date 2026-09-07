import jwt from 'jsonwebtoken';
const token = jwt.sign({ idUser: 1, role: 'Admin' }, 'default_web_secret', { expiresIn: '1h' });

async function test() {
  const res = await fetch('http://localhost:3002/user', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  const text = await res.text();
  console.log(res.status, text);
}
test();
