import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- INTERFACES (Βασισμένα ακριβώς στο db.json της Ελένης) ---

export interface Medication {
  id: string;             // Υπάρχει στο JSON (π.χ. "med_lasix_am")
  name: string;
  condition: string;
  dosage: string;
  time: string;
  taken: boolean;
  canPostpone: boolean;
  maxPostponeHours: number;
  image: string;          // Στο JSON είναι string, όχι null
}

export interface Log {
  time: string;
  medName: string;
  status: string;         // 'taken', 'missed' κτλ.
}

export interface DailyStats {
  total: number;
  taken: number;
  missed: number;
  postponed: number;
}

export interface HistoryRecord {
  date: string;
  stats: DailyStats;      // Προσοχή: Εδώ άλλαξε η δομή σε σχέση με το mock
  logs: Log[];            // Νέο πεδίο που είδαμε στο JSON
}

export interface Caregiver {
  name: string;
  phone: string;
  relation: string;
  image: string;
}

export interface UserProfile {
  id: string;
  name: string;
  profileImage: string;
  age: number;
  type: string;
  familyIds: string[];        // Νέο πεδίο στο JSON
  medications: Medication[];
  history: HistoryRecord[];
  caregivers?: Caregiver[];   // Το βάζω με ? (optional) γιατί η Ελένη δεν έχει, αλλά η Μαρία μπορεί να έχει
}

@Injectable({
  providedIn: 'root'
})
export class MedicationsService {

  // Το URL του Backend σου
  private apiUrl = 'http://localhost:8080/api/v1/medications';

  constructor(private http: HttpClient) { }

  // 1. Λήψη δεδομένων χρήστη βάσει ID
  getUserById(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}`);
  }

  // 2. Ενημέρωση status (για το κουμπί 'Got it')
  // Στέλνουμε ποιο φάρμακο πήρε και τι ώρα
  toggleMedication(userId: string, medId: string, status: boolean): Observable<any> {
    const body ={
      medId: medId,
      taken: status
    };
    return this.http.post(`${this.apiUrl}/${userId}/toggle`, body);
  }
}