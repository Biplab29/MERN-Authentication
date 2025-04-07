import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Register = () => {
  const { isAuthenticated } = useContext(Context);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleRegister = async (data) => {
    data.phone = `+91${data.phone}`;
    await axios
      .post("http://localhost:8081/api/v1/user/register", data, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        toast.success(res.data.message);
        navigate(`/otp-verification/${data.email}/${data.phone}`);
      })
      .catch((error) => {
        const message =
          error.response?.data?.message ||
          "Something went wrong during registration.";
        toast.error(message);
      });
  };

  return (
    <div>
      <form className="auth-form" onSubmit={handleSubmit(handleRegister)}>
        <h2>Register</h2>
        <input type="text" placeholder="Name" required {...register("name")} />
        <input
          type="email"
          placeholder="Email"
          required
          {...register("email")}
        />
        <div>
          <span> +91 </span>
          <input
            type="number"
            placeholder="Phone"
            required
            {...register("phone")}
          />
        </div>
        <input
          type="password"
          placeholder="Password"
          required
          {...register("password")}
        />
        <div className="verification-method">
          <p>Select verification Method</p>
          <div className="wrapper">
            <label>
              <input
                type="radio"
                value="email"
                name="verificationMethod"
                {...register("verificationMethod")}
                required
              />
              Email
            </label>
            <label>
              <input
                type="radio"
                value="phone"
                name="verificationMethod"
                {...register("verificationMethod")}
                required
              />
              Phone
            </label>
          </div>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
