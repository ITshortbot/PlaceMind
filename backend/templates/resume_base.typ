#let resume(
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  summary: "",
  experience: (),
  education: (),
  skills: (),
  projects: (),
  certifications: ()
) = {
  set page(margin: (x: 1.5cm, y: 1.5cm))
  set text(font: "Linux Libertine", size: 10pt)

  // Header
  align(center)[
    #text(size: 16pt, weight: "bold")[#name] \
    #email | #phone | #linkedin | #github
  ]

  v(1em)

  // Summary
  if summary != "" [
    #heading(level: 2)[Summary]
    #summary
    #v(0.5em)
  ]

  // Experience
  if experience.len() > 0 [
    #heading(level: 2)[Experience]
    #for exp in experience [
      *#exp.job_title* \
      #exp.company | #exp.start_date -- #exp.end_date \
      #for bullet in exp.bullets [
        - #bullet
      ]
      #v(0.5em)
    ]
  ]

  // Education
  if education.len() > 0 [
    #heading(level: 2)[Education]
    #for edu in education [
      *#edu.degree* \
      #edu.institution | #edu.start_date -- #edu.end_date \
      #v(0.5em)
    ]
  ]

  // Skills
  if skills.len() > 0 [
    #heading(level: 2)[Skills]
    #skills.join(", ")
    #v(0.5em)
  ]
}
