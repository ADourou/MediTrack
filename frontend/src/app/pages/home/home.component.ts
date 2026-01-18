import { Component, OnInit, OnDestroy, HostListener, Host } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MedicationsService } from '../../services/medications.service';
import { SmartSpeakerService } from '../../global/services/smart-speaker/smart-speaker.service';
//import { LearService } from 'src/app/global/services/leap/leap.services';
//import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  //smartwatch
  watchScreens: string[] = ['notification', 'schedule', 'sos'];
  currentScreenIndex: number = 0;
  watchScreen: string = 'notification';
  //private leapSub = Subscription = new Subcription();

  userid: string = '';
  userName: string = '';
  userImage: string = '';
  nextPill: any = null;
  medications: any[] = [];
  userType: string = '';

  timeRemaining: string = '';
  isOverdue: boolean = false;
  mockCurrentTime: Date = new Date();

  showConfirmation: boolean = false;
  currentView: string = 'home';
  selectedTime: string = 'weekly';
  selectedStat: string = 'missed';
  viewDate: Date = new Date();

  showSuccessmessage: boolean = false;

  showNotification: boolean = false;
  notificationData: any = null;

  showSOS: boolean = false;
  sosCountdown: number = 15;
  sosTimer: any = null;

  // --- MOBILE COMPATIBILITY VARIABLES (Added these) ---
  user: any = null; // Το mobile HTML θέλει όλο το user object
  isLoading: boolean = true;
  isSenior: boolean = false;
  isChild: boolean = false;
  nextMedication: any = null; // Alias για το nextPill
  timeDisplay: string = '';   // Alias για το timeRemaining

  showHelp: boolean = false;
  helpQuery: string = '';
  caregivers: any[] = [];

  showMenu: boolean = false;
  showExportMenu = false;

  //locks scroll when menu open
  toggleMenu() {
    this.showMenu = !this.showMenu;
    if (this.showMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  toggleExportMenu() {
    this.showExportMenu = !this.showExportMenu;
  }

  getDateRangeText(): string {
    if (this.selectedTime === 'weekly') {
      const start = new Date(this.viewDate);
      start.setDate(this.viewDate.getDate() - this.viewDate.getDay() + 1); // Δευτέρα
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Κυριακή

      return `${start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
    } else {
      return this.viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

  changeDateRange(direction: number) {
    const newDate = new Date(this.viewDate);
    if (this.selectedTime === 'weekly') {
      newDate.setDate(this.viewDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(this.viewDate.getMonth() + direction);
    }
    this.viewDate = newDate;
  }

  getMedicationStats() {
    if (!this.user || !this.user.history || !this.user.medications) return [];

    const uniqueMedNames = [...new Set(this.user.medications.map((m: any) => m.name))];
    const tempDate = new Date(this.viewDate);
    const day = tempDate.getDay();
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(tempDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    return uniqueMedNames.map(medName => {
      const weeklyHistory = [];
      const dosesPerDay = this.user.medications.filter((m: any) => m.name === medName).length;
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);

        const dateStr = currentDay.toISOString().split('T')[0]; // Format YYYY-MM-DD
        const dayData = this.user.history.find((h: any) => h.date === dateStr);

        let bars: any[] = [];
        let ratio = "";

        if (dayData) {
          const medLogs = dayData.logs ? dayData.logs.filter((l: any) => l.medName === medName) : [];
          bars = Array(dosesPerDay).fill('none');

          medLogs.forEach((log: any, index: number) => {
            if (index < dosesPerDay) {
              if (log.status === 'taken') {
                bars[index] = 'taken';
              } else if (log.status === 'postponed') {
                bars[index] = 'postponed';
              } else if (log.status === 'missed') {
                bars[index] = 'missed';
              }
            }
          });

          if (this.selectedStat === 'missed') {
            const count = bars.filter(s => s === 'missed').length;
            ratio = `${count}`;
          } else if (this.selectedStat === 'postponed') {
            const count = bars.filter(s => s === 'postponed').length;
            ratio = `${count}`;
          } else {
            // Default: Taken view
            const takenCount = bars.filter(s => s === 'taken').length;
            ratio = `${takenCount}/${dosesPerDay}`;
          }

        } else {
          bars = Array(dosesPerDay).fill('none');
          ratio = this.selectedStat === 'taken' ? `0/${dosesPerDay}` : "0";
        }

        weeklyHistory.push({
          dayLabel: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
          bars: bars,
          ratio: ratio
        });
      }

      return { name: medName, history: weeklyHistory };
    });
  }

  exportToCSV() {
    const stats = this.getMedicationStats();
    const dateRange = this.getDateRangeText();

    // header
    let csvContent = `Report: ${this.selectedTime} ${this.selectedStat}\n`;
    csvContent += `Date Range: ${dateRange}\n\n`;
    csvContent += `Medication,Day,Status/Ratio\n`;

    // fill data
    stats.forEach(med => {
      med.history.forEach(day => {
        const cleanRatio = day.ratio.replace(/✖|⏳/g, '').trim();
        csvContent += `"${med.name}","${day.dayLabel}","${cleanRatio}"\n`;
      });
    });

    // create and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = `Stats_${this.selectedTime}_${this.selectedStat}_${dateRange.replace(/ /g, '_')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showExportMenu = false;
  }

  exportToPDF() {
    this.showExportMenu = false;
    const doc = new jsPDF();
    const stats = this.getMedicationStats();

    doc.setFontSize(16);
    doc.text(`Medical Report: ${this.userName}`, 14, 15);
    const tableData: any[][] = [];

    stats.forEach(med => {
      med.history.forEach(day => {
        const cleanRatio = day.ratio.replace(/✖|⏳/g, '').trim();
        tableData.push([med.name, day.dayLabel, cleanRatio]);
      });
    });

    autoTable(doc, {
      head: [['Medication', 'Day', 'Status']],
      body: tableData,
      startY: 25,
      styles: { font: 'helvetica' },
      headStyles: { fillColor: [84, 148, 117] }
    });

    doc.save(`Report_${this.userName.replace(/\s+/g, '_')}.pdf`);
  }

  constructor(
    private route: ActivatedRoute,
    private medService: MedicationsService,
    private router: Router,
    private speaker: SmartSpeakerService
    //private leapService: LeapService
  ) {
    //this.mockCurrentTime.setHours(12,54,0,0);
  }

  getMonthlyAggregatedStats(med: any) {
    if (!this.user || !this.user.history) return [];

    const weeks = [];
    const targetMonth = this.viewDate.getMonth();
    const targetYear = this.viewDate.getFullYear();
    const monthHistory = this.user.history.filter((h: any) => {
      const d = new Date(h.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    for (let i = 0; i < 4; i++) {
      const weekSlice = monthHistory.slice(i * 7, (i + 1) * 7);
      let totalDoses = 0;
      let successDoses = 0;

      weekSlice.forEach((day: any) => {
        const medLogs = day.logs.filter((l: any) => l.medName === med.name);
        totalDoses += medLogs.length;


        if (this.selectedStat === 'missed') {
          successDoses += medLogs.filter((l: any) => l.status === 'missed').length;
        } else if (this.selectedStat === 'postponed') {
          successDoses += medLogs.filter((l: any) => l.status === 'postponed').length;
        } else {
          successDoses += medLogs.filter((l: any) => l.status === 'taken').length;
        }
      });

      const percentage = totalDoses > 0 ? Math.round((successDoses / totalDoses) * 100) : 0;

      weeks.push({
        label: `Week ${i + 1}`,
        percentage: percentage,
        taken: successDoses,
        total: totalDoses
      });
    }

    return weeks;
  }

  setView(viewName: string) {
    this.currentView = viewName;
    this.showMenu = false;
    document.body.style.overflow = 'auto';

    if (viewName === 'statistics') {
      console.log('Switching to Statistics for:', this.userName);
    }
  }

  ngOnInit(): void {

    /*Smart speaker start */

    this.speaker.initialize();
    this.speaker.addCommand('hello', () => {
      console.log("Command heard: hello");
      this.speaker.speak('Hello! I am your medical assistant!!');
    });

    this.speaker.addCommand('i took it', () => {
      console.log("Command heard: i took it");
      this.showConfirmation = true;
      this.speaker.speak('Are you sure you took yout medicine?');
    });

    this.speaker.addCommand("can't find my pills", () => {
      this.activateHelpScreen("I can't find my pills");
    });

    try {
      this.speaker.start();
    } catch (e) {
      console.log("microphone already started");
    }
    if (this.userType === 'child') {
      setTimeout(() => {
        this.speakAlien("Hello Sofia! Don't forget your meds!");
      }, 1000);
    }

    /*leap motion*/
    /*this.leapSub.add(
      this.leapService.onGesture().subscribe((gesture) => {
        const gestureName = this.leapService.GestureStr[gesture];
        if(gestureName === 'SWIPE_LEFT'){
          this.prevScreen();
        }
        else if(gestureName === 'SWIPE_RIGHT'){
          this.nextSreen();
        }
      })
    );*/
    const userId = this.route.snapshot.paramMap.get('id');

    if (userId) {
      this.fetchData(userId);

      /* Ανανέωση πραγματικού χρόνου και ελέγχου φαρμάκων κάθε 10 δευτερόλεπτα */
      setInterval(() => {
        this.mockCurrentTime = new Date();
        this.updatePillLogic(); // Κεντρική συνάρτηση ελέγχου
      }, 10000);

    } else {
      this.userName = 'user id not found in URL';
    }
  }

  getDayName(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  fetchData(id: string) {
    this.isLoading = true; // Mobile spinner start
    this.medService.getUserById(id).subscribe({
      next: (data) => {

        this.userid = id;
        this.user = data; // Για το mobile που ζητάει 'user.medications'
        this.userName = data.name;
        this.medications = data.medications;
        this.userImage = data.profileImage;
        this.userType = data.type;
        this.caregivers = data.caregivers || [];

        this.isChild = (this.userType === 'child');
        this.isSenior = (data.age >= 65);

        // Αρχικός υπολογισμός logic
        this.updatePillLogic();

        this.isLoading = false; // Mobile spinner stop
      },
      error: (error) => {
        console.error('error fetching data:', error);
        this.userName = 'Error loading user';
      }
    });
  }

  /* main function deciding which pill to show */
  updatePillLogic() {
    if (!this.medications || this.medications.length === 0) return;

    const now = new Date();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();


    const activeAlertPill = this.medications.find(m => {
      if (m.taken) return false;
      const [h, min] = m.time.split(':').map(Number);
      const medMins = h * 60 + min;
      const limitMins = m.canPostpone ? (m.maxPostponeHours * 60) : 0;


      return currentMinutes >= medMins && currentMinutes <= (medMins + limitMins);
    });

    if (activeAlertPill) {
      this.nextPill = activeAlertPill;
      this.nextMedication = this.nextPill; // Sync mobile
      this.calculateTime(this.nextPill.time);
      return;
    }


    const futurePill = this.medications.find(m => {
      if (m.taken) return false;
      const [h, min] = m.time.split(':').map(Number);
      return (h * 60 + min) > currentMinutes;
    });

    if (futurePill) {
      this.nextPill = futurePill;
      this.nextMedication = this.nextPill; // Sync mobile
      this.calculateTime(this.nextPill.time);
    } else {

      this.nextPill = null;
      this.nextMedication = null;
      this.timeRemaining = '';
      this.timeDisplay = '';
    }
  }

  calculateTime(pillTime: string) {
    if (!this.nextPill || this.showSuccessmessage) {
      return;
    }

    const now = new Date();
    const [hours, minutes] = pillTime.split(':').map(Number);
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    const medMinutes = (hours * 60) + minutes;

    const diffMins = medMinutes - currentMinutes;

    if (diffMins <= 0) {

      if (!this.showConfirmation && !this.isOverdue) {
        this.notificationData = this.nextPill;
        this.showNotification = true;

        if (this.userType === 'child') {
          this.speakAlien("Time for your " + this.nextPill.name);
        } else {
          this.speaker.speak("It is time for your " + this.nextPill.name);
        }
      }
      this.timeRemaining = 'Due now';
      this.timeDisplay = 'Due now';
      this.isOverdue = true;
    } else {

      this.isOverdue = false;
      if (diffMins < 60) {
        this.timeRemaining = `In ${diffMins} mins`;
      } else {
        const h = Math.round(diffMins / 60);
        this.timeRemaining = h === 1 ? `In 1 hour` : `In ${h} hours`;
      }
      this.timeDisplay = this.timeRemaining;
    }
  }

  ismedOverdue(pillTime: string): boolean {
    if (!pillTime) return false;
    const now = new Date();
    const [hours, minutes] = pillTime.split(':').map(Number);
    const pillDate = new Date();
    pillDate.setHours(hours, minutes, 0, 0);
    return pillDate.getTime() < now.getTime();
  }

  confirmTaken() {
    this.showNotification = false;
    const userId = this.userid;
    if (userId && this.nextPill) {
      this.medService.toggleMedication(userId, this.nextPill.id, true).subscribe({
        next: (response) => {
          this.showConfirmation = false;
          if (this.userType === 'child') {
            this.showSuccessmessage = true;
            setTimeout(() => { this.showSuccessmessage = false; }, 5000);
          }
          this.fetchData(userId);
        },
        error: (err) => { console.log('error taking pill'); }
      });
    }
  }

  confirmLater() { this.showConfirmation = false; }

  triggerAskMe() {
    console.log("Ask Me button clicked");
    try { this.speaker.start(); } catch (e) { }
    if (this.userType === 'child') {
      this.speakAlien("Hi Sofia! Do you need help with your missions?");
    } else {
      this.speaker.speak("Hello! I am listening. How can I help you today?");
    }
  }

  speakAlien(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 2;
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }

  triggerSOS() {
    this.showSOS = true;
    this.sosCountdown = 15;
    if (this.sosTimer) clearInterval(this.sosTimer);
    this.sosTimer = setInterval(() => {
      this.sosCountdown--;
      if (this.sosCountdown <= 0) { this.performSOSCall(); }
    }, 1000)
  }

  cancelSOS() {
    this.showSOS = false;
    if (this.sosTimer) { clearInterval(this.sosTimer); this.sosTimer = null; }
  }

  performSOSCall() {
    this.cancelSOS();
    this.speaker.speak("Calling emergency contacts now!");
    alert("Calling emergency contacts!");
  }

  // --- HELPERS ---
  getProfileImage(): string {
    return this.userImage || 'assets/profiles/profile_default_woman.png';
  }

  getScheduleStatus(med: any) {
    if (med.taken) return { text: 'Taken', cssClass: 'status-green' };
    if (this.ismedOverdue(med.time)) return { text: 'Overdue', cssClass: 'status-orange' };
    return { text: 'At ' + med.time, cssClass: 'status-normal' };
  }

  onSearchPharmacies() { alert('Searching for pharmacies near you...'); }

  activateHelpScreen(query: string) {
    this.showConfirmation = this.showNotification = this.showSuccessmessage = false;
    this.helpQuery = query;
    this.showHelp = true;
    const msg = "Don't worry. Help is on the way";
    this.isChild ? this.speakAlien(msg) : this.speaker.speak(msg);
  }

  ngOnDestroy() { if (this.sosTimer) clearInterval(this.sosTimer); }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') this.nextScreen();
    else if (event.key === 'ArrowLeft') this.prevScreen();
  }

  nextScreen() { if (this.currentScreenIndex < this.watchScreens.length - 1) { this.currentScreenIndex++; this.updateScreen(); } }
  prevScreen() { if (this.currentScreenIndex > 0) { this.currentScreenIndex--; this.updateScreen(); } }
  updateScreen() { this.watchScreen = this.watchScreens[this.currentScreenIndex]; }
  triggerWatchAction() { this.watchScreen === 'sos' ? this.triggerSOS() : this.confirmTaken(); }


  snoozeNotification(){
    this.showNotification = false;
    setTimeout(() => {
      if (this.nextMedication && !this.nextMedication.taken){
        this.showNotification = true;
        this.speaker.speak("Reminder. It is time for your medicine!");
      }
    }, 120000) /*2 lepta*/
  }
}

