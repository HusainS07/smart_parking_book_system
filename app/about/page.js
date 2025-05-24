import Head from "next/head";

export default function Home() {
  const TeamMember = ({ name, rollNumber, role }) => {
    return (
      <div className="team-member bg-gray-900 text-white p-6 rounded-xl w-72 text-center shadow-lg transition-all duration-300 ease-in-out transform hover:translate-y-2 hover:shadow-2xl">
        <h3 className="text-yellow-500 text-2xl mb-2">{name}</h3>
        <p>Roll Number: {rollNumber}</p>
        <p>Role: {role}</p>
        <p className="college text-yellow-500 font-semibold">
          Veermata Jijabai Technological Institute
        </p>
        <p className="degree text-white">B.Tech in Computer Engineering</p>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>About Us</title>
        <meta name="description" content="Meet our team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* About Container */}
      <section className="about-container pt-24 px-4 max-w-screen-xl mx-auto">
        <h2 className="text-4xl font-bold text-blue-800 mb-8 text-center">
          Meet Our Team
        </h2>

        {/* Team Section */}
        <div className="team flex flex-wrap justify-center gap-8 p-4">
          <TeamMember
            name="Akash Patil"
            rollNumber="241070901"
            role="Frontend"
          />
          <TeamMember
            name="Bhakti Baraf"
            rollNumber="241071907"
            role="Frontend"
          />
          <TeamMember
            name="Sakshi Mahale"
            rollNumber="241071905"
            role="Frontend"
          />
          <TeamMember
            name="Aditya Kulkarni"
            rollNumber="241070908"
            role="Backend"
          />
          <TeamMember
            name="Mohamed Husain Sakarwala"
            rollNumber="241070904"
            role="Backend"
          />
        </div>
      </section>
    </>
  );
}
