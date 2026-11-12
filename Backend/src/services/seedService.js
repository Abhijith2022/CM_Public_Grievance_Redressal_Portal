const {
  User,
  Department,
  Grievance,
  GrievanceHistory,
  DepartmentAssignment,
  CitizenFeedback,
  ContactEnquiry,
} = require('../models');
const { USER_ROLES } = require('../constants/keralaData');

const DEMO_CREDENTIALS = [
  {
    role: USER_ROLES.CITIZEN,
    label: 'Citizen (Demo)',
    email: 'citizen.ananya@prototype-portal.demo',
    password: 'CitizenDemo@2026',
    note: 'Submit grievances, optimize with AI, track status & give feedback',
  },
  {
    role: USER_ROLES.CMO_ADMIN,
    label: 'CMO Administrator (Demo)',
    email: 'cmo.admin@prototype-portal.demo',
    password: 'CmoDemo@2026',
    note: 'Central CMO review, AI summary inspection, dept forwarding & escalation',
  },
  {
    role: USER_ROLES.DEPARTMENT_OFFICER,
    label: 'Department Officer - PWD (Demo)',
    email: 'officer.pwd@prototype-portal.demo',
    password: 'OfficerDemo@2026',
    note: 'Investigate PWD grievances, update progress & submit action-taken report',
  },
  {
    role: USER_ROLES.DEPARTMENT_OFFICER,
    label: 'Department Officer - Health (Demo)',
    email: 'officer.health@prototype-portal.demo',
    password: 'OfficerDemo@2026',
    note: 'Investigate Health & Sanitation grievances',
  },
  {
    role: USER_ROLES.DEPARTMENT_OFFICER,
    label: 'Department Officer - Water (Demo)',
    email: 'officer.water@prototype-portal.demo',
    password: 'OfficerDemo@2026',
    note: 'Investigate Water Supply & Drainage grievances',
  },
];

const SAMPLE_DEPARTMENTS = [
  {
    name: 'Public Works & Infrastructure Department',
    code: 'PWD',
    shortDescription: 'Responsible for state highways, district roads, culverts, bridges, and public civic buildings.',
    categories: ['Roads & Public Infrastructure'],
    headDesignation: 'Chief Engineer (Prototype)',
    contactEmail: 'pwd.desk@prototype-portal.demo',
    slaDays: 7,
    isFeatured: true,
  },
  {
    name: 'Health & Family Welfare Department',
    code: 'HLTH',
    shortDescription: 'Oversees public hospitals, primary health centres, sanitation drives, and emergency medical services.',
    categories: ['Healthcare & Sanitation'],
    headDesignation: 'Director of Health Services (Prototype)',
    contactEmail: 'health.desk@prototype-portal.demo',
    slaDays: 3,
    isFeatured: true,
  },
  {
    name: 'General Education Department',
    code: 'EDU',
    shortDescription: 'Manages government schools, classroom infrastructure, student welfare, and academic administration.',
    categories: ['Education & Schools'],
    headDesignation: 'Nodal Education Officer (Prototype)',
    contactEmail: 'education.desk@prototype-portal.demo',
    slaDays: 7,
    isFeatured: true,
  },
  {
    name: 'Water Resources & Supply Authority',
    code: 'WTR',
    shortDescription: 'Handles drinking water pipelines, municipal supply schedules, drainage, and flood mitigation.',
    categories: ['Water Supply & Drainage'],
    headDesignation: 'Chief Water Engineer (Prototype)',
    contactEmail: 'water.desk@prototype-portal.demo',
    slaDays: 5,
    isFeatured: true,
  },
  {
    name: 'State Electricity & Power Distribution',
    code: 'PWR',
    shortDescription: 'Addresses power outages, transformer repairs, fallen utility lines, and streetlight safety.',
    categories: ['Electricity & Power'],
    headDesignation: 'Grid Operations Officer (Prototype)',
    contactEmail: 'power.desk@prototype-portal.demo',
    slaDays: 3,
    isFeatured: false,
  },
  {
    name: 'Revenue & Disaster Management',
    code: 'REV',
    shortDescription: 'Processes land records, certificate delays, disaster relief, and village office escalations.',
    categories: ['Revenue & Land Records'],
    headDesignation: 'District Revenue Nodal Officer (Prototype)',
    contactEmail: 'revenue.desk@prototype-portal.demo',
    slaDays: 10,
    isFeatured: false,
  },
  {
    name: 'Public Transport & Mobility',
    code: 'TRN',
    shortDescription: 'Coordinates state bus routes, terminal facilities, commuter safety, and last-mile connectivity.',
    categories: ['Public Transport'],
    headDesignation: 'Transport Operations Coordinator (Prototype)',
    contactEmail: 'transport.desk@prototype-portal.demo',
    slaDays: 7,
    isFeatured: false,
  },
  {
    name: 'Social Justice & Citizen Welfare',
    code: 'WEL',
    shortDescription: 'Administers welfare pensions, senior citizen care, accessibility support, and general public services.',
    categories: ['Social Welfare & Pensions', 'Public Safety & Services', 'Other'],
    headDesignation: 'Welfare Nodal Officer (Prototype)',
    contactEmail: 'welfare.desk@prototype-portal.demo',
    slaDays: 7,
    isFeatured: false,
  },
];

async function seedDemoData({ force = false } = {}) {
  const existingDeptCount = await Department.countDocuments();
  const existingUserCount = await User.countDocuments();

  if (!force && existingDeptCount > 0 && existingUserCount > 0) {
    return { skipped: true, reason: 'Database already contains records.' };
  }

  const deptMap = {};
  for (const deptData of SAMPLE_DEPARTMENTS) {
    const dept = await Department.findOneAndUpdate(
      { code: deptData.code },
      { $set: deptData },
      { upsert: true, new: true }
    );
    deptMap[dept.code] = dept;
  }

  const cmoPasswordHash = await User.hashPassword('CmoDemo@2026');
  const officerPasswordHash = await User.hashPassword('OfficerDemo@2026');
  const citizenPasswordHash = await User.hashPassword('CitizenDemo@2026');

  const usersToSeed = [
    {
      name: 'CMO Nodal Administrator (Demo)',
      email: 'cmo.admin@prototype-portal.demo',
      mobileNumber: '9800000001',
      passwordHash: cmoPasswordHash,
      role: USER_ROLES.CMO_ADMIN,
      designation: 'Chief Minister Grievance Cell Admin',
      district: 'Thiruvananthapuram',
      isDemoAccount: true,
    },
    {
      name: 'Arjun Menon (PWD Officer Demo)',
      email: 'officer.pwd@prototype-portal.demo',
      mobileNumber: '9800000002',
      passwordHash: officerPasswordHash,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      department: deptMap.PWD._id,
      designation: 'Executive Engineer (Roads)',
      district: 'Ernakulam',
      isDemoAccount: true,
    },
    {
      name: 'Dr. Meera Nair (Health Officer Demo)',
      email: 'officer.health@prototype-portal.demo',
      mobileNumber: '9800000003',
      passwordHash: officerPasswordHash,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      department: deptMap.HLTH._id,
      designation: 'District Medical Nodal Officer',
      district: 'Kozhikode',
      isDemoAccount: true,
    },
    {
      name: 'Suresh Babu (Water Officer Demo)',
      email: 'officer.water@prototype-portal.demo',
      mobileNumber: '9800000004',
      passwordHash: officerPasswordHash,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      department: deptMap.WTR._id,
      designation: 'Assistant Executive Engineer (Supply)',
      district: 'Thrissur',
      isDemoAccount: true,
    },
    {
      name: 'Ananya Krishnan (Citizen Demo)',
      email: 'citizen.ananya@prototype-portal.demo',
      mobileNumber: '9800000101',
      passwordHash: citizenPasswordHash,
      role: USER_ROLES.CITIZEN,
      district: 'Ernakulam',
      isDemoAccount: true,
    },
    {
      name: 'Rahul Varma (Citizen Demo)',
      email: 'citizen.rahul@prototype-portal.demo',
      mobileNumber: '9800000102',
      passwordHash: citizenPasswordHash,
      role: USER_ROLES.CITIZEN,
      district: 'Kozhikode',
      isDemoAccount: true,
    },
  ];

  const userMap = {};
  for (const u of usersToSeed) {
    const saved = await User.findOneAndUpdate(
      { email: u.email },
      { $set: u },
      { upsert: true, new: true }
    );
    userMap[saved.email] = saved;
  }

  const cmoAdmin = userMap['cmo.admin@prototype-portal.demo'];
  const pwdOfficer = userMap['officer.pwd@prototype-portal.demo'];
  const healthOfficer = userMap['officer.health@prototype-portal.demo'];
  const waterOfficer = userMap['officer.water@prototype-portal.demo'];
  const citizen1 = userMap['citizen.ananya@prototype-portal.demo'];
  const citizen2 = userMap['citizen.rahul@prototype-portal.demo'];

  const existingGrievances = await Grievance.countDocuments();
  if (existingGrievances === 0 || force) {
    if (force) {
      await Promise.all([
        Grievance.deleteMany({}),
        GrievanceHistory.deleteMany({}),
        DepartmentAssignment.deleteMany({}),
        CitizenFeedback.deleteMany({}),
      ]);
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const sampleGrievances = [
      {
        referenceId: 'KL-CMO-2026-1001',
        citizen: citizen1._id,
        district: 'Ernakulam',
        category: 'Roads & Public Infrastructure',
        subject: 'Severe potholes and waterlogging on Kaloor-Kadavanthra link road',
        description:
          'Heavy monsoon damage has caused deep craters along a 400m stretch near Kaloor Junction, causing two-wheeler skids and severe ambulance delays during peak hours.',
        originalDescription:
          'Road near kaloor junction completely broken lots of potholes water logging daily bikes falling please fix urgent.',
        status: 'In Progress',
        priority: 'High',
        assignedDepartment: deptMap.PWD._id,
        assignedOfficer: pwdOfficer._id,
        dueDate: new Date(now + 4 * dayMs),
        cmoPublicRemark: 'Forwarded to PWD Ernakulam Engineering Division for immediate temporary patching and resurfacing plan.',
        officerRemarks: 'Site inspection completed. Patchwork material mobilized; night repair scheduled.',
        aiAnalysis: {
          optimizedSubject: 'Severe road damage and waterlogging near Kaloor Junction, Ernakulam',
          optimizedDescription:
            'Respected Sir/Madam, Urgent repair is requested for a 400m stretch near Kaloor Junction where deep potholes and waterlogging are causing two-wheeler accidents and ambulance delays.',
          summary:
            'Citizen reports dangerous road craters and waterlogging near Kaloor Junction, Ernakulam, posing accident risks and delaying emergency vehicles.',
          highlights: [
            'Core Issue: Severe potholes and waterlogging on 400m road stretch',
            'Location: Kaloor-Kadavanthra link road, Ernakulam',
            'Public Impact: Two-wheeler accidents and ambulance traffic delays',
            'Recommended Priority: High due to road safety hazard',
          ],
          suggestedDepartmentCode: 'PWD',
          suggestedDepartmentName: deptMap.PWD.name,
          suggestedCategory: 'Roads & Public Infrastructure',
          suggestedPriority: 'High',
          reasoning: 'Road infrastructure safety hazard affecting emergency transport.',
          source: 'fallback',
          isFallback: true,
          modelUsed: 'seeded-sample-analysis',
          analyzedAt: new Date(now - 3 * dayMs),
          reviewedByCitizen: true,
          reviewedByCmo: true,
        },
        createdAt: new Date(now - 3 * dayMs),
      },
      {
        referenceId: 'KL-CMO-2026-1002',
        citizen: citizen2._id,
        district: 'Kozhikode',
        category: 'Healthcare & Sanitation',
        subject: 'Shortage of essential fever testing kits at Community Health Centre',
        description:
          'Patients visiting the block Community Health Centre in Kozhikode rural are being referred to private labs due to temporary stock-out of dengue/fever diagnostic kits.',
        status: 'Under Review',
        priority: 'High',
        assignedDepartment: deptMap.HLTH._id,
        assignedOfficer: healthOfficer._id,
        dueDate: new Date(now - 1 * dayMs),
        isEscalated: true,
        escalatedAt: new Date(now - 6 * 60 * 60 * 1000),
        escalationReason: 'SLA exceeded on High-priority public health supply complaint.',
        cmoPublicRemark: 'Escalated to District Medical Officer for immediate stock replenishment.',
        cmoInternalRemarks: [
          {
            remark: 'Flagged as overdue against 3-day Health SLA; escalated for urgent DMO confirmation.',
            addedBy: cmoAdmin._id,
            addedByName: cmoAdmin.name,
            createdAt: new Date(now - 6 * 60 * 60 * 1000),
          },
        ],
        aiAnalysis: {
          optimizedSubject: 'Diagnostic kit shortage at rural Community Health Centre, Kozhikode',
          summary:
            'Reported shortage of fever/dengue diagnostic kits at a Kozhikode rural CHC, forcing patients to incur private lab expenses.',
          highlights: [
            'Core Issue: Stock-out of fever diagnostic kits',
            'Location: Rural Block CHC, Kozhikode',
            'Impact: Economically vulnerable patients forced to use private labs',
          ],
          suggestedDepartmentCode: 'HLTH',
          suggestedDepartmentName: deptMap.HLTH.name,
          suggestedCategory: 'Healthcare & Sanitation',
          suggestedPriority: 'High',
          source: 'fallback',
          isFallback: true,
          modelUsed: 'seeded-sample-analysis',
          analyzedAt: new Date(now - 5 * dayMs),
          reviewedByCmo: true,
        },
        createdAt: new Date(now - 5 * dayMs),
      },
      {
        referenceId: 'KL-CMO-2026-1003',
        citizen: citizen1._id,
        district: 'Thrissur',
        category: 'Water Supply & Drainage',
        subject: 'Main drinking water pipeline burst near Thrissur East ward 12',
        description:
          'A major drinking water distribution pipe has been leaking heavily for 48 hours, wasting potable water and lowering household pressure across 60 homes.',
        status: 'In Progress',
        priority: 'High',
        assignedDepartment: deptMap.WTR._id,
        assignedOfficer: waterOfficer._id,
        dueDate: new Date(now + 2 * dayMs),
        cmoPublicRemark: 'Assigned to Water Resources & Supply Authority for emergency valve repair.',
        officerRemarks: 'Leak isolated; replacement coupling fitted and pressure testing underway.',
        actionTakenReport: {
          summary: 'Damaged 150mm PVC feeder collar replaced and chlorination check scheduled.',
          details:
            'Field crew isolated Ward 12 valve, excavated damaged joint, installed new heavy-duty collar, and restored partial pressure for verification.',
          submittedBy: waterOfficer._id,
          submittedByName: waterOfficer.name,
          submittedAt: new Date(now - 4 * 60 * 60 * 1000),
        },
        aiAnalysis: {
          summary: 'Major drinking water pipeline burst in Thrissur East Ward 12 disrupting supply to 60 households.',
          highlights: [
            'Core Issue: Drinking water feeder pipeline burst for 48 hours',
            'Location: Thrissur East Ward 12',
            'Impact: 60 households affected and potable water wastage',
          ],
          suggestedDepartmentCode: 'WTR',
          suggestedDepartmentName: deptMap.WTR.name,
          suggestedCategory: 'Water Supply & Drainage',
          suggestedPriority: 'High',
          source: 'fallback',
          isFallback: true,
          modelUsed: 'seeded-sample-analysis',
          analyzedAt: new Date(now - 2 * dayMs),
        },
        createdAt: new Date(now - 2 * dayMs),
      },
      {
        referenceId: 'KL-CMO-2026-1004',
        citizen: citizen2._id,
        district: 'Thiruvananthapuram',
        category: 'Electricity & Power',
        subject: 'Frequent low-voltage fluctuations damaging appliances in Kazhakkoottam lane',
        description:
          'Residents in Tech Corridor Side Lane 4 experience severe voltage drops every evening between 6 PM and 10 PM.',
        status: 'Submitted',
        priority: 'Medium',
        dueDate: new Date(now + 5 * dayMs),
        aiAnalysis: {
          summary: 'Evening low-voltage fluctuations reported in Kazhakkoottam lane affecting household appliances.',
          highlights: [
            'Core Issue: Evening voltage drops (6 PM - 10 PM)',
            'Location: Kazhakkoottam, Thiruvananthapuram',
            'Impact: Risk of appliance damage across residential lane',
          ],
          suggestedDepartmentCode: 'PWR',
          suggestedDepartmentName: deptMap.PWR.name,
          suggestedCategory: 'Electricity & Power',
          suggestedPriority: 'Medium',
          source: 'fallback',
          isFallback: true,
          modelUsed: 'seeded-sample-analysis',
          analyzedAt: new Date(now - 1 * dayMs),
        },
        createdAt: new Date(now - 1 * dayMs),
      },
      {
        referenceId: 'KL-CMO-2026-1005',
        citizen: citizen1._id,
        district: 'Alappuzha',
        category: 'Education & Schools',
        subject: 'Broken classroom ceiling fans and roof leak in Government High School block',
        description:
          'Two classrooms in Block B need waterproofing and electrical fan replacement before monsoon classes resume.',
        status: 'Resolved',
        priority: 'Medium',
        assignedDepartment: deptMap.PWD._id,
        assignedOfficer: pwdOfficer._id,
        dueDate: new Date(now - 2 * dayMs),
        resolvedAt: new Date(now - 3 * dayMs),
        cmoPublicRemark: 'Action-taken report verified by CMO. Roof waterproofing and fan installation completed.',
        officerRemarks: 'School HM sign-off obtained after repairs.',
        actionTakenReport: {
          summary: 'Roof sealing completed and 6 ceiling fans installed in Block B classrooms.',
          details: 'Maintenance wing sealed roof joints, tested wiring insulation, and installed 6 new fans.',
          submittedBy: pwdOfficer._id,
          submittedByName: pwdOfficer.name,
          submittedAt: new Date(now - 4 * dayMs),
        },
        aiAnalysis: {
          summary: 'Classroom roof leakage and non-functional ceiling fans reported at a Government High School in Alappuzha.',
          highlights: [
            'Core Issue: Classroom roof leak and broken ceiling fans',
            'Location: Alappuzha Government High School Block B',
          ],
          suggestedDepartmentCode: 'EDU',
          suggestedDepartmentName: deptMap.EDU.name,
          suggestedCategory: 'Education & Schools',
          suggestedPriority: 'Medium',
          source: 'fallback',
          isFallback: true,
          modelUsed: 'seeded-sample-analysis',
          analyzedAt: new Date(now - 8 * dayMs),
        },
        createdAt: new Date(now - 8 * dayMs),
      },
      {
        referenceId: 'KL-CMO-2026-1006',
        citizen: citizen2._id,
        district: 'Kollam',
        category: 'Public Transport',
        subject: 'Request to restore evening feeder bus connectivity after 7 PM',
        description:
          'Earlier complaint was marked resolved based on timetable update, but the 7:30 PM service has still not resumed on weekdays.',
        status: 'Reopened',
        priority: 'Medium',
        assignedDepartment: deptMap.TRN._id,
        dueDate: new Date(now + 4 * dayMs),
        reopenedAt: new Date(now - 12 * 60 * 60 * 1000),
        cmoPublicRemark: 'Reopened based on citizen feedback requesting verification of actual 7:30 PM bus operation.',
        aiAnalysis: {
          summary: 'Citizen reopened transport complaint stating scheduled 7:30 PM Kollam feeder bus service remains unoperated.',
          highlights: [
            'Core Issue: 7:30 PM feeder bus service not operating despite schedule notice',
            'Location: Kollam',
            'Status Context: Reopened by citizen for operational verification',
          ],
          suggestedDepartmentCode: 'TRN',
          suggestedDepartmentName: deptMap.TRN.name,
          suggestedCategory: 'Public Transport',
          suggestedPriority: 'Medium',
          source: 'fallback',
          isFallback: true,
          modelUsed: 'seeded-sample-analysis',
          analyzedAt: new Date(now - 9 * dayMs),
        },
        createdAt: new Date(now - 9 * dayMs),
      },
    ];

    for (const gData of sampleGrievances) {
      const g = await Grievance.create(gData);

      await GrievanceHistory.create({
        grievance: g._id,
        referenceId: g.referenceId,
        action: 'Grievance Submitted',
        fromStatus: '',
        toStatus: 'Submitted',
        remark: 'Grievance registered online and unique reference ID generated.',
        changedBy: g.citizen,
        changedByRole: USER_ROLES.CITIZEN,
        changedByName: g.citizen.equals(citizen1._id) ? citizen1.name : citizen2.name,
        createdAt: g.createdAt,
      });

      if (g.assignedDepartment) {
        await GrievanceHistory.create({
          grievance: g._id,
          referenceId: g.referenceId,
          action: 'Forwarded to Department',
          fromStatus: 'Submitted',
          toStatus: 'Under Review',
          remark: g.cmoPublicRemark || 'Reviewed by CMO and forwarded to department.',
          changedBy: cmoAdmin._id,
          changedByRole: USER_ROLES.CMO_ADMIN,
          changedByName: cmoAdmin.name,
          createdAt: new Date(g.createdAt.getTime() + 4 * 60 * 60 * 1000),
        });

        await DepartmentAssignment.create({
          grievance: g._id,
          department: g.assignedDepartment,
          assignedOfficer: g.assignedOfficer || null,
          assignedBy: cmoAdmin._id,
          instructions: g.cmoPublicRemark || 'Please investigate and submit action-taken report.',
          priority: g.priority,
          dueDate: g.dueDate,
          status:
            g.status === 'Resolved'
              ? 'Completed'
              : g.actionTakenReport?.submittedAt
              ? 'Action Submitted'
              : g.status === 'In Progress'
              ? 'In Progress'
              : 'Assigned',
          assignedAt: new Date(g.createdAt.getTime() + 4 * 60 * 60 * 1000),
          completedAt: g.resolvedAt || null,
        });
      }

      if (g.status === 'In Progress' || g.status === 'Resolved') {
        await GrievanceHistory.create({
          grievance: g._id,
          referenceId: g.referenceId,
          action: 'Investigation & Progress Update',
          fromStatus: 'Under Review',
          toStatus: 'In Progress',
          remark: g.officerRemarks || 'Department officer started field inspection.',
          changedBy: g.assignedOfficer || cmoAdmin._id,
          changedByRole: g.assignedOfficer ? USER_ROLES.DEPARTMENT_OFFICER : USER_ROLES.CMO_ADMIN,
          changedByName: g.assignedOfficer ? 'Department Officer (Demo)' : cmoAdmin.name,
          createdAt: new Date(g.createdAt.getTime() + 14 * 60 * 60 * 1000),
        });
      }

      if (g.status === 'Resolved') {
        await GrievanceHistory.create({
          grievance: g._id,
          referenceId: g.referenceId,
          action: 'Grievance Resolved',
          fromStatus: 'In Progress',
          toStatus: 'Resolved',
          remark: g.cmoPublicRemark,
          changedBy: cmoAdmin._id,
          changedByRole: USER_ROLES.CMO_ADMIN,
          changedByName: cmoAdmin.name,
          createdAt: g.resolvedAt,
        });

        await CitizenFeedback.create({
          grievance: g._id,
          citizen: g.citizen,
          rating: 5,
          isSatisfied: true,
          comment: 'Prompt repair completed before monsoon reopening. Thank you.',
          reopenRequested: false,
        });
      }

      if (g.status === 'Reopened') {
        await GrievanceHistory.create({
          grievance: g._id,
          referenceId: g.referenceId,
          action: 'Grievance Reopened by Citizen',
          fromStatus: 'Resolved',
          toStatus: 'Reopened',
          remark: 'Citizen reported evening service has not yet resumed on ground.',
          changedBy: g.citizen,
          changedByRole: USER_ROLES.CITIZEN,
          changedByName: citizen2.name,
          createdAt: g.reopenedAt,
        });
      }
    }
  }

  const enquiryCount = await ContactEnquiry.countDocuments();
  if (enquiryCount === 0) {
    await ContactEnquiry.create([
      {
        name: 'Kiran Joseph (Demo)',
        email: 'kiran.demo@prototype-portal.demo',
        subject: 'Accessibility support for senior citizens',
        message: 'Can citizens submit supporting PDF documents when filing pension grievances?',
        status: 'Reviewed',
      },
    ]);
  }

  return { skipped: false, seeded: true };
}

async function seedIfEmpty() {
  try {
    return await seedDemoData({ force: false });
  } catch (err) {
    if (err.code === 11000) {
      return { skipped: true, reason: 'Concurrent seed handled gracefully.' };
    }
    throw err;
  }
}

module.exports = {
  DEMO_CREDENTIALS,
  SAMPLE_DEPARTMENTS,
  seedDemoData,
  seedIfEmpty,
};
