import React from "react";
import "../styles/Instructor.css";
import instructorImage from "../assets/profile.jpg";

const Instructor = () => {
  return (
    <div className="instructor-page">
      <div className="instructor-card">
        <div className="instructor-image">
          <img src={instructorImage} alt="Instructor" />
        </div>
        <div className="instructor-info">
          <h1>Biplab Mahata</h1>
          <h4>Your Instructor</h4>
          <p>
            Hello! I'm Biplab Mahata, 
            I want To start my career as a technical person in software field by 
            using my technical knowledge and skills in learning environment 
            for the better growth of the organization.
          </p>
          <div className="social-links">
            <a
              href="https://github.com/Biplab29/"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/biplab-mahata/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
