import { prisma } from "./prisma";
import type {
  RecommendationInput,
  CourseRecommendation,
  AlternativeCourse,
} from "@/types";

// ─── Interest Keyword Mapping ───────────────────────────────────────

interface CourseMapping {
  courseSlug: string;
  courseName: string;
  keywords: string[];
  aliases: string[];
  description: string;
  idealFor: string[];
}

const COURSE_MAPPINGS: CourseMapping[] = [
  {
    courseSlug: "devops",
    courseName: "DevOps",
    keywords: [
      "cloud", "linux", "aws", "ci/cd", "cil", "automation",
      "infrastructure", "deployment", "docker", "kubernetes", "jenkins",
      "terraform", "ansible", "devops", "system administration", "sre",
    ],
    aliases: ["devops", "dev-ops", "cloud engineering"],
    description:
      "DevOps is about automating and streamlining the software delivery lifecycle using Linux, cloud platforms (AWS), CI/CD pipelines, Docker, Kubernetes and infrastructure-as-code.",
    idealFor: [
      "DevOps Engineer", "Cloud Engineer", "SRE", "System Administrator",
      "Infrastructure Engineer", "Platform Engineer",
    ],
  },
  {
    courseSlug: "devsecops",
    courseName: "DevSecOps",
    keywords: [
      "devsecops", "devops security", "secure ci/cd", "cloud security",
      "automation security", "application security", "secure devops",
    ],
    aliases: ["devsecops", "dev sec ops"],
    description:
      "DevSecOps integrates security into the DevOps pipeline — secure CI/CD, automated security scanning, cloud security and secure application development.",
    idealFor: ["DevSecOps Engineer", "Security Engineer", "Cloud Security Engineer"],
  },
  {
    courseSlug: "cyber-security",
    courseName: "Cyber Security",
    keywords: [
      "cyber security", "cybersecurity", "ethical hacking", "soc",
      "network security", "vapt", "penetration testing", "security operations",
      "threat detection", "incident response", "firewall", "intrusion",
    ],
    aliases: ["cyber security", "cyber", "cybersecurity", "security"],
    description:
      "Cyber Security covers Ethical Hacking, SOC (Security Operations Center), Network Security, VAPT and Penetration Testing to defend and protect systems.",
    idealFor: [
      "SOC Analyst", "Security Analyst", "Penetration Tester", "VAPT Engineer",
      "Security Engineer", "Ethical Hacker",
    ],
  },
  {
    courseSlug: "ethical-hacking",
    courseName: "Ethical Hacking",
    keywords: [
      "ethical hacking", "hacking", "pentest", "penetration testing",
      "vulnerability assessment", "kali linux", "exploitation", "bug bounty",
    ],
    aliases: ["ethical hacking", "hacking"],
    description:
      "Ethical Hacking focuses on penetration testing, vulnerability assessment, exploitation techniques and defensive security practices.",
    idealFor: ["Ethical Hacker", "Penetration Tester", "Security Researcher", "Bug Bounty Hunter"],
  },
  {
    courseSlug: "python-full-stack",
    courseName: "Python Full Stack",
    keywords: [
      "python", "django", "full stack", "backend", "web development",
      "programming", "software developer", "beginner", "api", "flask",
      "rest api", "javascript", "react",
    ],
    aliases: ["python", "python full stack", "py"],
    description:
      "Python Full Stack covers Python programming, backend development with Django/Flask, APIs, databases and React for building complete web applications.",
    idealFor: [
      "Full Stack Developer", "Backend Developer", "Python Developer",
      "Software Developer", "Web Developer",
    ],
  },
  {
    courseSlug: "java-full-stack",
    courseName: "Java Full Stack",
    keywords: [
      "java", "spring boot", "enterprise", "java developer", "full stack",
      "backend development", "microservices", "hibernate", "j2ee",
      "enterprise applications",
    ],
    aliases: ["java", "java full stack"],
    description:
      "Java Full Stack covers Java programming, Spring Boot, REST APIs, databases and React for building scalable, enterprise-grade applications.",
    idealFor: ["Java Developer", "Full Stack Developer", "Backend Developer", "Enterprise Developer"],
  },
  {
    courseSlug: "data-science",
    courseName: "Data Science",
    keywords: [
      "data science", "data analytics", "machine learning", "ml", "ai",
      "statistics", "data analysis", "predictive", "tensorflow",
      "data scientist", "python data",
    ],
    aliases: ["data science", "data", "analytics", "ml", "ai"],
    description:
      "Data Science covers Python, data analytics, statistics, machine learning and AI to build data-driven careers.",
    idealFor: ["Data Scientist", "Data Analyst", "ML Engineer", "Data Engineer", "Business Analyst"],
  },
  {
    courseSlug: "cloud-computing",
    courseName: "Cloud Computing",
    keywords: [
      "aws", "cloud computing", "azure", "cloud architecture", "cloud engineer",
      "gcp", "s3", "ec2", "lambda", "cloudformation",
    ],
    aliases: ["cloud", "aws", "cloud computing", "azure"],
    description:
      "Cloud Computing covers AWS/Azure, cloud architecture, infrastructure provisioning and deployment using cloud-native services.",
    idealFor: ["Cloud Architect", "Cloud Engineer", "AWS Engineer", "Solutions Architect"],
  },
];

const BACKGROUND_KEYWORDS: Record<string, string[]> = {
  "python-full-stack": ["b.com", "bcom", "b.sc", "bsc", "bba", "commerce", "arts", "non-it"],
  "java-full-stack": ["b.tech", "btech", "b.e", "engineering", "computer science", "cse", "it"],
  "data-science": ["maths", "statistics", "mathematics", "physics", "economics", "analytics"],
  "cyber-security": ["eee", "ece", "electronics", "electrical", "diploma"],
};

// ─── Recommendation Engine ──────────────────────────────────────────

export async function getCourseRecommendation(
  input: RecommendationInput
): Promise<CourseRecommendation> {
  const interestScores = new Map<string, number>();
  const interestReasons = new Map<string, string[]>();

  for (const course of COURSE_MAPPINGS) {
    interestScores.set(course.courseSlug, 0);
    interestReasons.set(course.courseSlug, []);
  }

  if (input.interests) {
    const interestLower = input.interests.toLowerCase();
    for (const course of COURSE_MAPPINGS) {
      for (const keyword of course.keywords) {
        if (interestLower.includes(keyword)) {
          const currentScore = interestScores.get(course.courseSlug) || 0;
          interestScores.set(course.courseSlug, currentScore + 3);
          interestReasons.get(course.courseSlug)?.push(
            `Interest in "${keyword}" matches ${course.courseName}`
          );
        }
      }
    }
  }

  if (input.careerGoal) {
    const goalLower = input.careerGoal.toLowerCase();
    for (const course of COURSE_MAPPINGS) {
      for (const keyword of course.keywords) {
        if (goalLower.includes(keyword)) {
          const currentScore = interestScores.get(course.courseSlug) || 0;
          interestScores.set(course.courseSlug, currentScore + 2);
          interestReasons.get(course.courseSlug)?.push(
            `Career goal mentions "${keyword}" aligns with ${course.courseName}`
          );
        }
      }
      for (const ideal of course.idealFor) {
        if (goalLower.includes(ideal.toLowerCase().split(" ")[0])) {
          const currentScore = interestScores.get(course.courseSlug) || 0;
          interestScores.set(course.courseSlug, currentScore + 2);
          interestReasons.get(course.courseSlug)?.push(
            `Career goal "${ideal}" aligns with ${course.courseName}`
          );
        }
      }
    }
  }

  if (input.background) {
    const bgLower = input.background.toLowerCase();
    for (const [slug, keywords] of Object.entries(BACKGROUND_KEYWORDS)) {
      for (const keyword of keywords) {
        if (bgLower.includes(keyword)) {
          const currentScore = interestScores.get(slug) || 0;
          interestScores.set(slug, currentScore + 2);
          interestReasons.get(slug)?.push(
            `Background in "${keyword}" suits ${slug.replace(/-/g, " ")}`
          );
        }
      }
    }
  }

  if (input.currentRole) {
    const roleLower = input.currentRole.toLowerCase();
    for (const course of COURSE_MAPPINGS) {
      for (const ideal of course.idealFor) {
        if (roleLower.includes(ideal.toLowerCase().split(" ")[0])) {
          const currentScore = interestScores.get(course.courseSlug) || 0;
          interestScores.set(course.courseSlug, currentScore + 2);
          interestReasons.get(course.courseSlug)?.push(
            `Current role aligns with ${course.courseName} target audience`
          );
        }
      }
    }
  }

  if (input.isFresher === true || (input.experience && input.experience.toLowerCase().includes("fresher"))) {
    const fresherBoost = ["python-full-stack", "data-science"];
    for (const slug of fresherBoost) {
      const currentScore = interestScores.get(slug) || 0;
      interestScores.set(slug, currentScore + 1);
      interestReasons.get(slug)?.push("Fresher-friendly course recommendation");
    }
  }

  if (input.qualification) {
    const qualLower = input.qualification.toLowerCase();
    if (qualLower.includes("b.tech") || qualLower.includes("btech") || qualLower.includes("engineering")) {
      const currentScore = interestScores.get("java-full-stack") || 0;
      interestScores.set("java-full-stack", currentScore + 1);
      interestReasons.get("java-full-stack")?.push("Engineering background suits Java Full Stack");
    }
    if (qualLower.includes("bsc") || qualLower.includes("b.com") || qualLower.includes("bba")) {
      const currentScore = interestScores.get("python-full-stack") || 0;
      interestScores.set("python-full-stack", currentScore + 1);
      interestReasons.get("python-full-stack")?.push("Non-engineering graduate - good fit for Python Full Stack");
    }
  }

  if (input.age) {
    if (input.age < 23) {
      const currentScore = interestScores.get("python-full-stack") || 0;
      interestScores.set("python-full-stack", currentScore + 1);
      interestReasons.get("python-full-stack")?.push("Young age - Python Full Stack is a great starting point");
    }
    if (input.age >= 25) {
      const currentScore = interestScores.get("data-science") || 0;
      interestScores.set("data-science", currentScore + 1);
      interestReasons.get("data-science")?.push("Experienced candidate - Data Science has strong growth");
    }
  }

  const sorted = Array.from(interestScores.entries()).sort((a, b) => b[1] - a[1]);

  const topSlug = sorted[0]?.[0] || "python-full-stack";
  const topScore = sorted[0]?.[1] || 0;

  const topCourse = COURSE_MAPPINGS.find((c) => c.courseSlug === topSlug);
  const totalKeywords = input.interests ? input.interests.split(/\s+/).length : 1;
  const confidence = Math.min(Math.round((topScore / (totalKeywords * 3)) * 100), 95);
  const finalConfidence = Math.max(confidence, 20);

  const reasons = interestReasons.get(topSlug) || [];
  const reasoning =
    reasons.length > 0
      ? reasons.join(". ") + "."
      : `Based on the information provided, ${topCourse?.courseName || "Python Full Stack Development"} seems like a good starting point. We can refine this recommendation after discussing your specific goals.`;

  const alternatives: AlternativeCourse[] = sorted
    .slice(1, 4)
    .filter(([, score]) => score > 0)
    .map(([slug, score]) => {
      const course = COURSE_MAPPINGS.find((c) => c.courseSlug === slug);
      const altReasons = interestReasons.get(slug) || [];
      return {
        courseId: slug,
        courseName: course?.courseName || slug,
        confidence: Math.min(Math.round((score / (totalKeywords * 3)) * 100), 80),
        reason:
          altReasons.length > 0
            ? altReasons[0]
            : "Alternative option based on your profile",
      };
    });

  let courseId = topSlug;
  try {
    const dbCourse = await prisma.course.findFirst({
      where: {
        OR: [
          { slug: topSlug },
          { name: { contains: topCourse?.courseName || "", mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: { id: true },
    });
    if (dbCourse) courseId = dbCourse.id;
  } catch {
    // DB might not be available yet
  }

  return {
    courseId,
    courseName: topCourse?.courseName || "Python Full Stack Development",
    confidence: finalConfidence,
    reasoning,
    alternatives,
  };
}

export function getCourseMapping(slug: string): CourseMapping | undefined {
  return COURSE_MAPPINGS.find(
    (c) => c.courseSlug === slug || c.aliases.includes(slug)
  );
}

export { COURSE_MAPPINGS };
