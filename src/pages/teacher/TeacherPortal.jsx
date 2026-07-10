import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PortalHeader from '../../components/layout/PortalHeader'
import { getMyClassrooms } from '../../api/academics'
import { useAuth } from '../../context/AuthContext'

import classroomImg from '../../assets/domains/classroom.png'
import planningImg from '../../assets/domains/planning.png'
import assessmentImg from '../../assets/domains/assessment.png'
import reportingImg from '../../assets/domains/reporting.png'
import welfareImg from '../../assets/domains/welfare.png'
import adminImg from '../../assets/domains/admin.png'

const domains = [
  {
    key: 'classroom',
    title: 'Classroom',
    desc: 'Attendance, cover lessons, extracurricular activities and inter-school competitions.',
    tags: ['Attendance', 'Cover Lessons', 'Extracurricular'],
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    href: '/teacher/classroom',
    available: true,
    gradient: 'from-blue-700 to-blue-900',
    image: classroomImg,
  },
  {
    key: 'planning',
    title: 'Planning',
    desc: 'Scheme of work, lesson plans and BECE / WASSCE revision planning.',
    tags: ['Scheme of Work', 'Lesson Plans', 'BECE / WASSCE'],
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    available: false,
    gradient: 'from-teal-600 to-emerald-800',
    image: planningImg,
  },
  {
    key: 'assessment',
    title: 'Assessment',
    desc: 'CA scores, homework, class tests, mock exams and question setting and marking.',
    tags: ['CA Scores', 'Mock Exams', 'Marking'],
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    available: false,
    gradient: 'from-orange-600 to-red-800',
    image: assessmentImg,
  },
  {
    key: 'reporting',
    title: 'Reporting',
    desc: 'Terminal reports, report cards, class rankings, promotion decisions and candidate readiness.',
    tags: ['Report Cards', 'Rankings', 'Promotion'],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    available: false,
    gradient: 'from-purple-700 to-violet-900',
    image: reportingImg,
  },
  {
    key: 'welfare',
    title: 'Student Welfare',
    desc: 'Behaviour records, parent communication log and at-risk student tracking.',
    tags: ['Behaviour', 'Parent Comms', 'At-Risk'],
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    available: false,
    gradient: 'from-rose-600 to-pink-800',
    image: welfareImg,
  },
  {
    key: 'admin',
    title: 'Professional & Admin',
    desc: 'NTC CPD hours, staff meetings, INSET days, textbook inventory and speech day.',
    tags: ['CPD / NTC', 'Meetings', 'Textbooks'],
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    available: false,
    gradient: 'from-navy to-navy-deep',
    image: adminImg,
  },
]

function TeacherPortal() {
  const { user, activeMember } = useAuth()

  const { data } = useQuery({
    queryKey: ['my-classrooms'],
    queryFn: getMyClassrooms,
  })

  const classrooms = data?.data?.classrooms || []
  const totalStudents = classrooms.reduce((sum, c) => sum + c.student_count, 0)
  const subjectIds = new Set()
  classrooms.forEach((c) => c.subjects.forEach((s) => subjectIds.add(s.id)))

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain) => {
            const CardInner = (
              <>
                <div className="relative z-10">
                  <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={domain.icon} />
                    </svg>
                  </div>

                  <div className="font-serif text-base font-bold text-white mb-1.5">{domain.title}</div>
                  <div className="text-[11px] text-white/70 mb-4 leading-relaxed min-h-[38px]">{domain.desc}</div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {domain.tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/80">
                    {domain.available ? 'Open' : 'Coming Soon'}
                  </span>
                </div>

                <img
                  src={domain.image}
                  alt=""
                  className="absolute -right-2 -bottom-2 w-24 h-24 object-contain opacity-90 pointer-events-none"
                />
              </>
            )

            const cardClass = `relative overflow-hidden bg-gradient-to-br ${domain.gradient} rounded-xl p-4 sm:p-5 min-h-[185px] flex flex-col justify-between transition-all`
            return domain.available ? (
              <Link key={domain.key} to={domain.href} className={`${cardClass} hover:shadow-xl hover:-translate-y-1`}>
                {CardInner}
              </Link>
            ) : (
              <div key={domain.key} className={`${cardClass} opacity-90`}>
                {CardInner}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TeacherPortal