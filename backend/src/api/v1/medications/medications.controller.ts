import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';

//go 4 files back and in the file data
//backend\data\db.json
const DB_FILE = "data/db.json";

export class MedicationsController {
    

    applyRoutes() {
        const router = Router();
        
        // 1. GET for taking the data
        router.get('/:id', this.getUserData);

        // 2. POST for updating med data
        router.post('/:id/toggle', this.updateMedication);

        return router; 
    }

    getUserData = (req:any, res:any) => {
        const userId = req.params.id;

        console.log(DB_FILE)

        // reading from db.json
        const textData = fs.readFileSync(DB_FILE, 'utf-8');
        const allUsers = JSON.parse(textData);

        const user = allUsers.find((u: any) => u.id === userId);

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    }

    // Change status of a med
    updateMedication = (req:any, res:any) => {
        const userId = req.params.id;  
        const medId = req.body.medId;  
        const isTaken = req.body.taken;

        const textData = fs.readFileSync(DB_FILE, 'utf-8');
        const allUsers = JSON.parse(textData);
        const user = allUsers.find((u: any) => u.id === userId);

        if (user) {
            const medication = user.medications.find((m:any) => m.id === medId);

            if (medication) {
                medication.taken = isTaken;
                // (Το null, 2 είναι απλά για να φαίνεται ωραία το JSON όταν το ανοίγεις)
                fs.writeFileSync(DB_FILE, JSON.stringify(allUsers, null, 2));

                res.json({ message: 'Success! Saved to database.' });
            } else {
                res.status(404).json({ error: 'Medication ID not found' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    }
}