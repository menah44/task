"use client";

import React from "react";
import { useRouter } from "next/navigation";

const UserForm = () => {
  const router = useRouter(); 
  const handleLogout = () => {
    
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    router.push("/login");
  };

  return (
    <div
      style={{ padding: "40px", fontFamily: "sans-serif", textAlign: "center" }}
    >
  

        <button
          onClick={handleLogout}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          تسجيل الخروج (userforms) 
        </button>
      </div>
   
  );
};

export default UserForm;
