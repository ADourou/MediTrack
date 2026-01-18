# 💊 MediTrack

**MediTrack** is an intelligent medication management and adherence platform designed to support patients and caregivers through smart tracking, voice interaction, and data analytics.



## 🚀 Key Features
* **Adherence Tracking:** Priority based monitoring (**Taken**, **Postponed**, **Missed**) for accurate health records.
* **Smart Analytics:** Weekly and Monthly dashboards with visual progress bars and compliance ratios.
* **Voice Assistant:** Integrated smartspeaker commands for hands free medication confirmation and help.
* **Medical Reporting:** Instant export of adherence data to **CSV** and **PDF** for clinical use.
* **Multi-Profile Support:** Custom interfaces tailored for elderly users and children.
* **Emergency SOS:** One-touch SOS feature with countdown and automatic caregiver notification.

## 🛠️ Tech Stack
* **Frontend:** Angular 17, TypeScript, SCSS.
* **Deployment:** Docker & Docker Compose for containerization.
* **Voice Integration:** Web Speech API.
* **Reporting:** jsPDF & jspdf-autotable.



## 📦 Installation & Setup

### 🐳 Using Docker (Recommended)
The easiest way to run the entire stack (including all dependencies) is using Docker:

```bash
# Build and start the containers
docker-compose up --build
