# Medical Consultation App

## Overview
This project is a web-based application designed to manage online medical consultations. It facilitates the interaction between doctors and patients, allowing for schedule management, appointment booking, and user administration.

## Key Features
* **Role-Based Access:** Distinct portals for Doctors (schedule management), Patients (booking & history), and Administrators.
* **Interactive Calendar:** Matrix-style schedule visualization for checking availability and booking slots.
* **Appointment System:** Complete flow from slot selection to reservation confirmation and payment simulation.
* **Authentication:** Secure login and registration handling using JWT or Firebase Auth.

## Technology Stack
* **Frontend:** React, TypeScript
* **Backend:** Node.js / Express (REST API)
* **Data Persistence:** Dynamic support for Local JSON, Google Firebase, and MongoDB/SQL.

## Project Structure
The repository follows a **monorepo** structure:
* `/client` - Frontend application (React)
* `/server` - Backend API and logic (Node.js)