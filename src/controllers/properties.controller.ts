
import { type Response, type Request, type NextFunction } from "express";
import { supabase } from "../lib/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        // Add other fields if necessary
    };
}
export const createProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { title, description, price, address, latitude, longitude, property_type, status, bedrooms, bathrooms, square_feet } = req.body
    let imageUrl: string | null = null;
    const user_id: string = (req as AuthenticatedRequest).user?.id || '';

    if (req.file) {
        try {
            const filePath = `properties/${uuidv4()}.jpg`; 

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });




            if (uploadError && uploadError !== null) {
                res.status(500).json({ error: 'Failed to upload image' });
            }

            imageUrl = supabase.storage.from('property-images').getPublicUrl(filePath).data.publicUrl;
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }

    try {
        const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .insert({
                title, description, price, address, latitude, longitude, user_id, property_type, status, bedrooms, bathrooms, square_feet
            }).select().single()


        if (imageUrl) {
            const { error: imageError } = await supabase
                .from('property_images')
                .insert([{
                    property_id: propertyData?.id,
                    url: imageUrl,
                    is_primary: true,
                }]);
            if (imageError) {
                res.status(500).json({ error: 'Failed to associate image with property' });
            }
        }

        res.status(201).json({ message: 'Property created successfully', propertyId: propertyData?.id });

    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });

    }
}

export const getProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user_id: string = (req as AuthenticatedRequest).user?.id || '';


        const { data, error } = await supabase
            .from('properties')
            .select('id,title,description,price,address,bedrooms,bathrooms,square_feet,property_type,status,latitude,longitude,property_images(id,property_id,url)')
            .eq('user_id', user_id);

        if (error) {
            res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });
    }
}

export const getDetailProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params

        const { data, error } = await supabase
            .from('properties') // your table
            .select('id,title,description,price,address,bedrooms,bathrooms,square_feet,property_type,status,latitude,longitude,property_images(id,property_id,url)')
            .eq('id', id)
            .single();

        if (error) {
            res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);

        console.log(data)
    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });

    }
}

export const updateProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;  
    const { title, description, price, address, latitude, longitude, property_type, status, bedrooms, bathrooms, square_feet } = req.body;
    let imageUrl: string | null = null;
    const user_id: string = (req as AuthenticatedRequest).user?.id || '';

    if (req.file) {
        try {
            const filePath = `properties/${uuidv4()}.jpg`; 

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

            if (uploadError && uploadError !== null) {
                 res.status(500).json({ error: 'Failed to upload image' });
            }

            imageUrl = supabase.storage.from('property-images').getPublicUrl(filePath).data.publicUrl;
        } catch (error) {
            console.log(error);
             res.status(500).json({ error: 'Failed to upload image' });
        }
    }

    try {
        const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .update({
                title,
                description,
                price,
                address,
                latitude,
                longitude,
                user_id,
                property_type,
                status,
                bedrooms,
                bathrooms,
                square_feet
            })
            .eq('id', id) 
            .select()
            .single();

        if (propertyError) {
             res.status(500).json({ error: 'Failed to update property' });
        }

        if (imageUrl) {
            const { data: existingImages, error: imageFetchError } = await supabase
                .from('property_images')
                .select('id')
                .eq('property_id', id)
                .limit(1); 

            if (imageFetchError) {
                 res.status(500).json({ error: 'Failed to fetch property images' });
            }

            if (existingImages && existingImages.length > 0) {
                const { error: imageUpdateError } = await supabase
                    .from('property_images')
                    .update({ url: imageUrl })
                    .eq('property_id', id)
                    .eq('is_primary', true);

                if (imageUpdateError) {
                     res.status(500).json({ error: 'Failed to update property image' });
                }
            } else {
                const { error: imageInsertError } = await supabase
                    .from('property_images')
                    .insert([{
                        property_id: id,
                        url: imageUrl,
                        is_primary: true,
                    }]);

                if (imageInsertError) {
                     res.status(500).json({ error: 'Failed to associate image with property' });
                }
            }
        }

        res.status(200).json({ message: 'Property updated successfully', propertyId: propertyData?.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update property' });
    }
};

export const deleteProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;  
    const user_id: string = (req as AuthenticatedRequest).user?.id || '';

    try {
        const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (propertyError || !property) {
             res.status(404).json({ error: 'Property not found' });
        }

        if (property && property.user_id !== user_id) {
             res.status(403).json({ error: 'Unauthorized to delete this property' });
        }

        const { data: images, error: imageFetchError } = await supabase
            .from('property_images')
            .select('id')
            .eq('property_id', id);

        if (imageFetchError) {
             res.status(500).json({ error: 'Failed to fetch property images for deletion' });
        }

        const { error: imageDeleteError } = await supabase
            .from('property_images')
            .delete()
            .eq('property_id', id);

        if (imageDeleteError) {
             res.status(500).json({ error: 'Failed to delete property images' });
        }

        const { error: propertyDeleteError } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (propertyDeleteError) {
             res.status(500).json({ error: 'Failed to delete property' });
        }

        res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
};