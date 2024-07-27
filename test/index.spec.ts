import BRX, { BRK } from '../src/index.js';
import { add_color1 } from './esm/schema.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

describe('index', () => {
  describe('execution_tests', () => {
    it('RUN DEFAULT PERPLEX', async () => {
      const brx = new BRX(process.env.BRXAI_API_KEY!);
      const addcolor = new BRK(add_color1);
      expect(addcolor.input).toBeDefined();
    });
  });
});
