import * as express from 'express';
import { ExampleController } from './example/example.controller';
import { ItemShopController } from './item-shop/item-shop.controller';
import { TaskController } from './task/task.controller';

import { MedicationsController } from './medications/medications.controller';


const apiV1Router = express.Router();

apiV1Router
  // Example routes
  .use(
    '/example',
    new ExampleController().applyRoutes()
  )
  .use(
    '/item-shop',
    new ItemShopController().applyRoutes()
  )
  .use(
    '/tasks',
    new TaskController().applyRoutes()
  )
  // route /medications
  .use(
    '/medications',
    new MedicationsController().applyRoutes()
  );
  

export { apiV1Router };