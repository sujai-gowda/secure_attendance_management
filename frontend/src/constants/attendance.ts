export interface Teacher {
  id: string
  name: string
}

export interface Course {
  id: string
  name: string
}

export interface Student {
  rollNo: string
  name: string
}

export interface Class {
  id: string
  name: string
  students: Student[]
}

export const TEACHERS: Teacher[] = [
  { id: '1', name: 'Dr. Smith' },
  { id: '2', name: 'Prof. Johnson' },
  { id: '3', name: 'Dr. Williams' },
  { id: '4', name: 'Prof. Brown' },
]

export const COURSES: Course[] = [
  { id: '1', name: 'Data Structures and Algorithms' },
  { id: '2', name: 'Database Management Systems' },
  { id: '3', name: 'Computer Networks' },
  { id: '4', name: 'Operating Systems' },
  { id: '5', name: 'Software Engineering' },
]

export const CLASSES: Class[] = [
  {
    id: '1',
    name: 'Class A - First Year',
    students: [
      { rollNo: '1', name: 'Alice Johnson' },
      { rollNo: '2', name: 'Bob Smith' },
      { rollNo: '3', name: 'Charlie Brown' },
      { rollNo: '4', name: 'Diana Prince' },
      { rollNo: '5', name: 'Eve Wilson' },
      { rollNo: '6', name: 'Frank Miller' },
      { rollNo: '7', name: 'Grace Lee' },
      { rollNo: '8', name: 'Henry Davis' },
    ],
  },
  {
    id: '2',
    name: 'Class B - Second Year',
    students: [
      { rollNo: '1', name: 'Ivy Martinez' },
      { rollNo: '2', name: 'Jack Anderson' },
      { rollNo: '3', name: 'Kate Taylor' },
      { rollNo: '4', name: 'Liam White' },
      { rollNo: '5', name: 'Mia Harris' },
      { rollNo: '6', name: 'Noah Clark' },
      { rollNo: '7', name: 'Olivia Lewis' },
      { rollNo: '8', name: 'Paul Walker' },
    ],
  },
  {
    id: '3',
    name: 'Class C - Third Year',
    students: [
      { rollNo: '1', name: 'Quinn Young' },
      { rollNo: '2', name: 'Rachel King' },
      { rollNo: '3', name: 'Sam Wright' },
      { rollNo: '4', name: 'Tina Lopez' },
      { rollNo: '5', name: 'Uma Hill' },
      { rollNo: '6', name: 'Victor Scott' },
      { rollNo: '7', name: 'Wendy Green' },
      { rollNo: '8', name: 'Xavier Adams' },
    ],
  },
]

