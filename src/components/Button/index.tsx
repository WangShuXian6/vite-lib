import './Button.scss'
export type ButtonProps = {
  label: string;
};
const Button = ({ label }: ButtonProps) => {
  return (
    <>
      <div className="btn">{label}</div>
    </>
  );
};

export default Button