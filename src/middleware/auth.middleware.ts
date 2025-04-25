import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
    user?: User; // or the exact structure of `data.user` from Supabase
  }

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) res.status(401).json({ error: 'Unauthorized: No token' });

    const { data, error } = await supabase.auth.getUser(token);


    if (error || !data) {
        res.status(403).json({ error: 'Unauthorized' });
    }
    if (error || !data?.user) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }
    
      req.user = data.user;

    next();
};