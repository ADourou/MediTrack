import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MedicationsService, UserProfile, Medication } from '../../services/medications.service';

@Component({
  selector: 'app-mobile',
  templateUrl: './mobile.component.html',
  styleUrls: ['./mobile.component.scss']
})
export class MobileComponent implements OnInit {

  user: UserProfile | undefined;

  isSenior: boolean = false;
  isChild: boolean = false;

  nextMedication: Medication | null = null;
  timeDisplay: string = '';
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private medService: MedicationsService
  ) { }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    if (userId) {
      this.loadUserData(userId);
    } else {
      this.isLoading = false;
    }
  }

  // asks data from backend
  loadUserData(id: string) {
    this.isLoading = true;
    this.medService.getUserById(id).subscribe({
      next: (data) => {
        this.user = data;

        // Determine User Group
        const age = (this.user as any).age;

        if (age >= 65) {
          this.isSenior = true;
        } else if (age <= 12) {
          this.isChild = true;
        }

        this.findNextMedication();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('error loading user:', err);
        this.isLoading = false;
      }
    });
  }

  getProfileImage(): string {
    if (this.user && this.user.profileImage) {
      return this.user.profileImage;
    } else {
      return 'assets/profiles/profile_default_woman.png';
    }
  }

  findNextMedication() {
    if (!this.user) return;

    const now = new Date();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();

    const pendingMeds = this.user.medications.filter(m => !m.taken);
    pendingMeds.sort((a, b) => a.time.localeCompare(b.time));

    let validCandidate = null;
    let validDiff = 0;

    for (const med of pendingMeds) {
      const timeParts = med.time.split(':');
      const medMinutes = (Number(timeParts[0]) * 60) + Number(timeParts[1]);
      const diff = medMinutes - currentMinutes;

      if (diff >= 1) {
        validCandidate = med;
        validDiff = diff;
        break;
      }
    }

    if (validCandidate) {
      this.nextMedication = validCandidate;

      if (validDiff > 59) {
        const hours = Math.round(validDiff / 60);
        if (hours === 1) {
          this.timeDisplay = 'In 1 hour';
        } else {
          this.timeDisplay = 'In ' + hours + ' hours';
        }
      } else {
        if (validDiff === 1) {
          this.timeDisplay = 'In 1 minute';
        } else {
          this.timeDisplay = 'In ' + validDiff + ' minutes';
        }
      }
    } else {
      this.nextMedication = null;
    }
  }

  getScheduleStatus(med: Medication) {
    if (med.taken) {
      return { text: 'Taken', cssClass: 'status-green' };
    }

    const now = new Date();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    const timeParts = med.time.split(':');
    const medMinutes = (Number(timeParts[0]) * 60) + Number(timeParts[1]);
    const diff = medMinutes - currentMinutes;

    if (diff < 0) {
      return { text: 'Overdue', cssClass: 'status-orange' };
    }

    if (diff < 60) {
      return { text: 'In ' + diff + ' minutes', cssClass: 'status-normal' };
    }

    return { text: 'At ' + med.time, cssClass: 'status-normal' };
  }

  dismissNotification() {
    this.nextMedication = null;
  }

  onSearchPharmacies() {
    console.log('pharmacy search...');
  }
}