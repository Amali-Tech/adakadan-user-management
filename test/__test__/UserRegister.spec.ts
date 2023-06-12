import request from 'supertest';
import app from '../../src/config/app';



test('returns 200 OK when dignup request is valid', (done) => {
  request(app)
    .post('/api/1.0.0/users')
    .send({ firstName: 'John', lastName: 'Doe', password: 'password1' })
    .then((response) => {
      expect(response.status).toBe(200);
      done();
    });
});


