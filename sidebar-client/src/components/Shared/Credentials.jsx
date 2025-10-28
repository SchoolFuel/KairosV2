import "../../styles/Credentials.css";

export default function Credentials(props) {

  return (
    <div className="credentials-container">
      <div className="hamburger-icon">&#9776;</div>
      <p>{props.email}</p>
    </div>
  );
}
