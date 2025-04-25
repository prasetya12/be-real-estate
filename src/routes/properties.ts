import {Router} from 'express';
import multer from "multer";
import { createProperties, getProperties } from '../controllers/properties.controller';
import { authenticate } from '../middleware/auth.middleware';

const storage = multer.memoryStorage();
const upload = multer({storage});

export const propertiesRouter:Router =  Router();
propertiesRouter.post('/',authenticate,upload.single('image'),createProperties);
propertiesRouter.get('/',authenticate,getProperties);
