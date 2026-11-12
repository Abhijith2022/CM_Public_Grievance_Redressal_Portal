const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
];

const GRIEVANCE_CATEGORIES = [
  'Roads & Public Infrastructure',
  'Healthcare & Sanitation',
  'Education & Schools',
  'Water Supply & Drainage',
  'Electricity & Power',
  'Revenue & Land Records',
  'Public Transport',
  'Social Welfare & Pensions',
  'Public Safety & Services',
  'Other',
];

const GRIEVANCE_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Reopened',
];

const GRIEVANCE_PRIORITIES = ['Low', 'Medium', 'High'];

const USER_ROLES = {
  CITIZEN: 'citizen',
  CMO_ADMIN: 'cmo_admin',
  DEPARTMENT_OFFICER: 'department_officer',
};

const PROTOTYPE_DISCLAIMER =
  'Recruitment Prototype Notice: This application is a technical demonstration built strictly with fictional sample data. It is not an official portal and does not imply authorization or endorsement by the Government of Kerala or the Chief Minister\'s Office.';

const SAMPLE_FAQS = [
  {
    id: 'faq-1',
    category: 'Submission',
    question: 'How do I submit a grievance to the Chief Minister\'s Office?',
    answer:
      'Register or sign in as a Citizen, open the Citizen Portal, select your district and category, enter your complaint subject and description, optionally run the AI Grievance Assistant to optimize your complaint, attach supporting evidence, and submit to receive a unique Reference ID.',
  },
  {
    id: 'faq-2',
    category: 'Tracking',
    question: 'How can I track the progress of my submitted grievance?',
    answer:
      'Visit Track Grievance and enter your unique Reference ID (for example, KL-CMO-2026-1001). You will see the current status, assigned department, public remarks from CMO and officers, and a timestamped lifecycle timeline.',
  },
  {
    id: 'faq-3',
    category: 'AI Assistant',
    question: 'Does the AI Grievance Assistant make official approval or rejection decisions?',
    answer:
      'No. AI suggestions are strictly advisory. The assistant helps optimize wording, summarizes complaints for the CMO, highlights key facts, and recommends a department, category, and priority, while human CMO administrators and officers make every official decision.',
  },
  {
    id: 'faq-4',
    category: 'Resolution',
    question: 'What can I do if I am dissatisfied after my grievance is marked Resolved?',
    answer:
      'In your Citizen Portal, open the resolved grievance and submit feedback. You can select "Not Satisfied (Request Reopen)" or use Reopen Grievance to return the case to the CMO queue with a documented reason.',
  },
  {
    id: 'faq-5',
    category: 'Attachments',
    question: 'What file formats and sizes are accepted for supporting documents?',
    answer:
      'Images and documents in JPG, PNG, WEBP, PDF, TXT, DOC, or DOCX format up to 3 MB per file (up to 3 files per submission) are supported and stored securely in MongoDB Atlas.',
  },
  {
    id: 'faq-6',
    category: 'Departments',
    question: 'How long does department investigation normally take?',
    answer:
      'Each department has an indicative Service Level Agreement (SLA) between 3 and 10 days depending on category urgency. Delayed cases are automatically flagged as overdue for CMO escalation.',
  },
];

module.exports = {
  KERALA_DISTRICTS,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
  GRIEVANCE_PRIORITIES,
  USER_ROLES,
  PROTOTYPE_DISCLAIMER,
  SAMPLE_FAQS,
};
