import styles from "./About.module.css";

function About() {
  return (
    <div className={styles.about}>
      <h1>About GoatTimer</h1>
      <p>
        GoatTimer is a revolutionary productivity app tailored specifically for
        students who aspire to excel in their studies. Our mission is to
        transform the way everyone approaches learning by combining effective
        time management techniques with gamification elements that make studying
        engaging and rewarding.
      </p>
      <hr></hr>
      <h2>Key Features</h2>
      <ul className={styles.aboutList}>
        <li className={styles.aboutItem}>
          <strong>Goal Tracking:</strong> Set personalized study goals and track
          your progress in real-time.
        </li>
        <li className={styles.aboutItem}>
          <strong>Study/Work Sessions:</strong> Use our Pomodoro-inspired timers
          to maintain focus during study sessions.
        </li>
        <li className={styles.aboutItem}>
          <strong>Competitive Leaderboard:</strong> Compete with peers and climb
          the ranks to stay motivated.
        </li>
        <li className={styles.aboutItem}>
          <strong>Progress Analytics:</strong> Visualize your study habits with
          detailed statistics and insights.
        </li>
      </ul>
      <hr></hr>
      <p>
        Whether you're preparing for exams, working on projects, or just trying
        to build better study habits, GoatTimer provides the tools and
        motivation you need to become the Greatest Of All Time (G.O.A.T.) in
        your academic pursuits.
      </p>
      <a
        href="https://github.com/Group2Goats/GoatTimer"
        target="_blank"
        rel="noopener noreferrer"
      >
        Checkout the github repo!
      </a>
    </div>
  );
}

export default About;
