export const FIELDS = [
  { id: 'cs-it', label: 'Computer science, software engineering or IT' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'health', label: 'Medicine, nursing or health sciences' },
  { id: 'sciences', label: 'Physical or life sciences' },
  { id: 'business', label: 'Business, accounting or economics' },
  { id: 'law', label: 'Law' },
  { id: 'social', label: 'Social sciences or mass communication' },
  { id: 'arts', label: 'Arts, languages or humanities' },
  { id: 'education', label: 'Education' },
  { id: 'agriculture', label: 'Agriculture or environmental sciences' },
  { id: 'other', label: 'Another course' },
] as const
export type FieldId = (typeof FIELDS)[number]['id']

export const LEVELS = [
  { id: '100', label: '100 level', graduateStage: false },
  { id: '200', label: '200 level', graduateStage: false },
  { id: '300', label: '300 level', graduateStage: false },
  { id: '400', label: '400 level', graduateStage: false },
  { id: '500', label: '500 level or above', graduateStage: false },
  { id: 'graduate', label: 'Graduate (first degree completed)', graduateStage: true },
  { id: 'postgraduate', label: 'Postgraduate student', graduateStage: true },
] as const
export type LevelId = (typeof LEVELS)[number]['id']

export const SKILLS = [
  { id: 'programming', label: 'Programming' },
  { id: 'web', label: 'Web or app development' },
  { id: 'data', label: 'Data analysis or machine learning' },
  { id: 'research', label: 'Research and academic writing' },
  { id: 'writing', label: 'Writing and communication' },
  { id: 'design', label: 'Design' },
  { id: 'leadership', label: 'Leadership and public speaking' },
  { id: 'entrepreneurship', label: 'Entrepreneurship' },
  { id: 'community', label: 'Community or volunteer work' },
  { id: 'open-source', label: 'Open-source contributions' },
] as const
export type SkillId = (typeof SKILLS)[number]['id']

export const OPPORTUNITY_TYPES = [
  { id: 'scholarship', label: 'Scholarships', singular: 'Scholarship', hint: 'Funding for study' },
  { id: 'internship', label: 'Internships', singular: 'Internship', hint: 'Work placements and attachments' },
  { id: 'hackathon', label: 'Hackathons', singular: 'Hackathon', hint: 'Build-and-compete events' },
  { id: 'fellowship', label: 'Fellowships and programmes', singular: 'Fellowship or programme', hint: 'Structured learning or mentoring' },
  { id: 'grant', label: 'Grants', singular: 'Grant', hint: 'Money for projects or ventures' },
] as const
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]['id']

export const WORK_EXPERIENCE = [
  { id: 'none', label: 'None yet' },
  { id: 'under2', label: 'Under 2 years' },
  { id: 'twoplus', label: '2 years or more' },
] as const
export type WorkExperience = (typeof WORK_EXPERIENCE)[number]['id']

export function labelOf<T extends { id: string; label: string }>(list: readonly T[], id: string): string {
  return list.find((item) => item.id === id)?.label ?? id
}

export function isGraduateStage(level: LevelId | ''): boolean {
  return LEVELS.find((l) => l.id === level)?.graduateStage ?? false
}
