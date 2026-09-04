import { PrismaClient, UserRole, LearningMode, LeadSource, LeadStatus, LeadTemperature } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding GreatCoder CRM...");

  // ─── Admin & Counselor users ────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const counselorPassword = await bcrypt.hash("Counselor@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@thegreatcoder.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@thegreatcoder.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const counselor = await prisma.user.upsert({
    where: { email: "counselor@thegreatcoder.com" },
    update: {},
    create: {
      name: "Priya",
      email: "counselor@thegreatcoder.com",
      passwordHash: counselorPassword,
      role: UserRole.COUNSELOR,
    },
  });

  console.log("✅ Users created:", admin.email, "/", counselor.email);

  // ─── Course data ────────────────────────────────────────────────
  const courses = [
    {
      slug: "devops",
      name: "DevOps",
      shortDesc: "Automate and streamline software delivery with Linux, cloud, CI/CD, Docker & Kubernetes.",
      description: "Master DevOps fundamentals including Linux, AWS, CI/CD pipelines, Docker, Kubernetes and infrastructure-as-code to build a career in cloud & automation.",
      duration: "4.5 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Intermediate",
      prerequisites: "Basic computer knowledge",
      featured: true,
      sortOrder: 1,
      modules: [
        { title: "Linux Fundamentals", order: 1, topics: ["Linux basics & commands", "Shell scripting", "File systems & permissions"] },
        { title: "Version Control & CI/CD", order: 2, topics: ["Git & GitHub", "Jenkins pipelines", "Build automation"] },
        { title: "Containerization", order: 3, topics: ["Docker essentials", "Docker Compose", "Container orchestration"] },
        { title: "Cloud & Infrastructure as Code", order: 4, topics: ["AWS core services", "Terraform", "Ansible configuration management"] },
      ],
      faqs: [
        { q: "Do I need coding experience for DevOps?", a: "No, DevOps focuses more on Linux, cloud and automation tools than on programming. Basic scripting knowledge helps." },
        { q: "Which cloud is covered?", a: "The course covers AWS as the primary cloud platform, with DevOps tools that work across clouds." },
      ],
    },
    {
      slug: "devsecops",
      name: "DevSecOps",
      shortDesc: "Integrate security into the DevOps pipeline — secure CI/CD, cloud security and automation.",
      description: "Learn how to embed security into every stage of the software lifecycle including secure CI/CD, automated scanning and cloud security.",
      duration: "4.5 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Advanced",
      prerequisites: "DevOps fundamentals recommended",
      featured: false,
      sortOrder: 2,
      modules: [
        { title: "Security Foundations", order: 1, topics: ["Security principles", "Threat modeling", "Secure coding basics"] },
        { title: "Secure CI/CD", order: 2, topics: ["SAST & DAST scanning", "Dependency scanning", "Pipeline security"] },
        { title: "Cloud Security", order: 3, topics: ["Identity & access (IAM)", "Cloud hardening", "Compliance basics"] },
      ],
      faqs: [
        { q: "Is this a separate course from DevOps?", a: "Yes, DevSecOps builds on DevOps by adding security throughout the pipeline. Prior DevOps knowledge is helpful." },
      ],
    },
    {
      slug: "cyber-security",
      name: "Cyber Security",
      shortDesc: "Defend networks and systems — SOC, network security, VAPT and incident response.",
      description: "Comprehensive cyber security training covering Security Operations Center (SOC), network security, VAPT and penetration testing.",
      duration: "5 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Intermediate",
      prerequisites: "Interest in security, networking basics",
      featured: true,
      sortOrder: 3,
      modules: [
        { title: "Networking Basics", order: 1, topics: ["TCP/IP model", "Routing & switching", "Network protocols"] },
        { title: "Security Operations (SOC)", order: 2, topics: ["SIEM tools", "Threat monitoring", "Incident response"] },
        { title: "VAPT & Pen Testing", order: 3, topics: ["Vulnerability assessment", "Penetration testing", "Reporting"] },
      ],
      faqs: [
        { q: "I'm a beginner, can I learn cyber security?", a: "Yes. The course starts with networking fundamentals before moving into security operations and testing." },
      ],
    },
    {
      slug: "ethical-hacking",
      name: "Ethical Hacking",
      shortDesc: "Hack ethically — penetration testing, vulnerability assessment and defensive security.",
      description: "Learn penetration testing, vulnerability assessment, exploitation techniques and how to defend systems as an ethical hacker.",
      duration: "4 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Intermediate",
      prerequisites: "Networking basics recommended",
      featured: false,
      sortOrder: 4,
      modules: [
        { title: "Hacking Foundations", order: 1, topics: ["Ethical hacking methodology", "Kali Linux essentials", "Footprinting & reconnaissance"] },
        { title: "Vulnerability & Exploitation", order: 2, topics: ["Scanning & enumeration", "Exploitation techniques", "Web app attacks"] },
        { title: "Defense & Reporting", order: 3, topics: ["Hardening techniques", "Post-exploitation", "Pen-test reports"] },
      ],
      faqs: [
        { q: "Is ethical hacking legal?", a: "Yes, ethical hacking is performed with authorization to test and secure systems. The course focuses on legal, ethical practices." },
      ],
    },
    {
      slug: "python-full-stack",
      name: "Python Full Stack",
      shortDesc: "Build complete web apps — Python, Django, APIs, databases and React frontend.",
      description: "Learn Python programming, backend development with Django/Flask, REST APIs, databases and React to build full-stack web applications.",
      duration: "6 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Beginner",
      prerequisites: "No prior programming required",
      featured: true,
      sortOrder: 5,
      modules: [
        { title: "Python Fundamentals", order: 1, topics: ["Python syntax & variables", "Control flow & functions", "OOP in Python"] },
        { title: "Backend Development", order: 2, topics: ["Django framework", "REST APIs", "Databases (SQL)"] },
        { title: "Frontend with React", order: 3, topics: ["HTML/CSS/JavaScript", "React components", "Connecting frontend to backend"] },
        { title: "Projects & Deployment", order: 4, topics: ["Building full-stack projects", "Deployment", "Git workflows"] },
      ],
      faqs: [
        { q: "I have no coding background, is this suitable?", a: "Yes, Python Full Stack is beginner-friendly and starts from the fundamentals before moving into backend and frontend development." },
      ],
    },
    {
      slug: "java-full-stack",
      name: "Java Full Stack",
      shortDesc: "Enterprise-grade applications — Java, Spring Boot, REST APIs and React.",
      description: "Learn Java, Spring Boot, microservices, databases and React to build scalable enterprise web applications.",
      duration: "6 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Intermediate",
      prerequisites: "Basic programming knowledge",
      featured: true,
      sortOrder: 6,
      modules: [
        { title: "Java Core", order: 1, topics: ["Java syntax & OOP", "Collections & exceptions", "Multithreading basics"] },
        { title: "Spring Boot", order: 2, topics: ["Spring Boot fundamentals", "REST APIs", "Microservices concepts"] },
        { title: "Frontend & Database", order: 3, topics: ["React for frontend", "SQL & JPA/Hibernate", "Building projects"] },
      ],
      faqs: [
        { q: "Is Java still in demand?", a: "Yes, Java remains widely used in enterprise and banking applications. Spring Boot is a leading backend framework." },
      ],
    },
    {
      slug: "data-science",
      name: "Data Science",
      shortDesc: "Turn data into decisions — Python, statistics, machine learning and AI.",
      description: "Learn data analytics, statistics, Python and machine learning to build data-driven careers in data science and AI.",
      duration: "6 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Intermediate",
      prerequisites: "Basic programming recommended",
      featured: true,
      sortOrder: 7,
      modules: [
        { title: "Data Foundations", order: 1, topics: ["Python for data", "NumPy & Pandas", "Data visualization"] },
        { title: "Statistics & Analytics", order: 2, topics: ["Statistical concepts", "Exploratory data analysis", "A/B testing"] },
        { title: "Machine Learning", order: 3, topics: ["Supervised learning", "Unsupervised learning", "Model evaluation"] },
        { title: "AI & Projects", order: 4, topics: ["Intro to deep learning", "Real-world projects", "MLOps basics"] },
      ],
      faqs: [
        { q: "Do I need a math background?", a: "A basic understanding of statistics and math helps, but the course teaches the concepts from scratch." },
      ],
    },
    {
      slug: "cloud-computing",
      name: "Cloud Computing",
      shortDesc: "AWS/Azure cloud architecture, core services and infrastructure provisioning.",
      description: "Learn cloud architecture, AWS and Azure core services, and how to provision and manage cloud infrastructure.",
      duration: "3 months",
      price: null,
      mode: LearningMode.OFFLINE,
      level: "Beginner",
      prerequisites: "Basic IT knowledge",
      featured: false,
      sortOrder: 8,
      modules: [
        { title: "Cloud Fundamentals", order: 1, topics: ["Cloud concepts", "AWS core services", "Compute & storage"] },
        { title: "Networking & Databases", order: 2, topics: ["VPC & networking", "Cloud databases", "Managed services"] },
        { title: "Architecture & Deployment", order: 3, topics: ["Solutions architecture", "Auto-scaling", "Cost optimization"] },
      ],
      faqs: [
        { q: "Should I learn AWS or Azure?", a: "The course covers both, with a focus on AWS core services and cloud architecture principles that apply across providers." },
      ],
    },
  ];

  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        shortDesc: c.shortDesc,
        description: c.description,
        duration: c.duration,
        price: c.price,
        mode: c.mode,
        level: c.level,
        prerequisites: c.prerequisites,
        featured: c.featured,
        sortOrder: c.sortOrder,
        modules: {
          create: c.modules.map((m) => ({
            title: m.title,
            order: m.order,
            topics: {
              create: m.topics.map((t, i) => ({ title: t, order: i })),
            },
          })),
        },
        faqs: {
          create: c.faqs.map((f, i) => ({ question: f.q, answer: f.a, order: i })),
        },
      },
    });
    console.log(`✅ Course: ${course.name}`);
  }

  // ─── Sample leads ───────────────────────────────────────────────
  const devops = await prisma.course.findUnique({ where: { slug: "devops" } });
  const pyfs = await prisma.course.findUnique({ where: { slug: "python-full-stack" } });
  const ds = await prisma.course.findUnique({ where: { slug: "data-science" } });

  const leads = [
    {
      name: "Rahul Sharma",
      phone: "9876543210",
      email: "rahul@example.com",
      qualification: "B.Tech",
      experience: "2 years",
      currentRole: "System Administrator",
      currentLocation: "Hyderabad",
      interestedCourseId: devops?.id,
      careerGoal: "Switch to DevOps/Cloud",
      status: LeadStatus.INTERESTED,
      temperature: LeadTemperature.HOT,
      leadScore: 82,
      source: LeadSource.CHATBOT,
      joiningTimeline: "Within a month",
      preferredCallbackTime: "Evening 6 PM",
    },
    {
      name: "Sneha Reddy",
      phone: "9123456780",
      email: "sneha@example.com",
      qualification: "B.Com",
      experience: "Fresher",
      currentRole: "Fresher",
      currentLocation: "Gachibowli, Hyderabad",
      interestedCourseId: pyfs?.id,
      careerGoal: "Become a Full Stack Developer",
      status: LeadStatus.NEW,
      temperature: LeadTemperature.WARM,
      leadScore: 58,
      source: LeadSource.META_ADS,
      joiningTimeline: "Next month",
    },
    {
      name: "Arjun Mehta",
      phone: "9988776655",
      email: "arjun@example.com",
      qualification: "M.Sc Statistics",
      experience: "4 years",
      currentRole: "Analyst",
      currentLocation: "Madhapur",
      interestedCourseId: ds?.id,
      careerGoal: "Move into Data Science",
      status: LeadStatus.FOLLOW_UP,
      temperature: LeadTemperature.WARM,
      leadScore: 64,
      source: LeadSource.WEBSITE,
      joiningTimeline: "Within 3 months",
    },
  ];

  for (const l of leads) {
    const lead = await prisma.lead.create({ data: l });
    console.log(`✅ Lead: ${lead.name}`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\nLogins:");
  console.log(`  Admin:    admin@thegreatcoder.com / Admin@123`);
  console.log(`  Counselor: counselor@thegreatcoder.com / Counselor@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
