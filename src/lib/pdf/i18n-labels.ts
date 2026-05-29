export type FieldLabel = 
  | 'age'
  | 'politicalStatus'
  | 'gender'
  | 'ethnicity'
  | 'hometown'
  | 'maritalStatus'
  | 'yearsOfExperience'
  | 'educationLevel'
  | 'email'
  | 'phone'
  | 'wechat'
  | 'location'
  | 'website'
  | 'linkedin'
  | 'github';

const labels: Record<string, Record<FieldLabel, string>> = {
  de: {
    age: 'Alter',
    politicalStatus: 'Pronomen',
    gender: 'Geschlecht',
    ethnicity: 'Nationalität',
    hometown: 'Geburtsort',
    maritalStatus: 'Familienstand',
    yearsOfExperience: 'Erfahrung',
    educationLevel: 'Bildungsabschluss',
    email: 'E-Mail',
    phone: 'Telefon',
    wechat: 'WeChat',
    location: 'Wohnort',
    website: 'Web',
    linkedin: 'LinkedIn',
    github: 'GitHub',
  },
  en: {
    age: 'Age',
    politicalStatus: 'Pronouns',
    gender: 'Gender',
    ethnicity: 'Nationality',
    hometown: 'Hometown',
    maritalStatus: 'Marital Status',
    yearsOfExperience: 'Experience',
    educationLevel: 'Education',
    email: 'Email',
    phone: 'Phone',
    wechat: 'WeChat',
    location: 'Location',
    website: 'Web',
    linkedin: 'LinkedIn',
    github: 'GitHub',
  },
  zh: {
    age: '年龄',
    politicalStatus: '政治面貌',
    gender: '性别',
    ethnicity: '民族',
    hometown: '籍贯',
    maritalStatus: '婚姻状况',
    yearsOfExperience: '经验',
    educationLevel: '学历',
    email: '邮箱',
    phone: '电话',
    wechat: '微信',
    location: '所在地',
    website: '网站',
    linkedin: '领英',
    github: 'GitHub',
  },
};

export function getLabel(key: FieldLabel, lang: string = 'en'): string {
  const dictionary = labels[lang] || labels['en'];
  return dictionary[key] || labels['en'][key] || key;
}
