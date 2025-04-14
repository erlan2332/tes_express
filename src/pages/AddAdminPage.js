import React, { useState } from "react";
import { API_BASE } from "../config";
import { useNavigate } from "react-router-dom";
import "./AddAdminPage.css";            //‑> создашь по желанию

export default function AddAdminPage() {
  const [form, setForm] = useState({
    login: "",
    password: "",
    phoneNumber: "",
    name: "",
    surname: "",
    patronymic: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const resp = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${creds}`,      // убери, если эндпоинт публичный
        },
        body: JSON.stringify({
          ...form,
          roleId: 2,             // <‑‑‑ ID роли «ADMIN» (проверь, какой у тебя)
          // либо roleName: "ADMIN"
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Ошибка: ${resp.status} – ${txt}`);
      }

      const txt = await resp.text();
      setSuccess(txt || "Администратор создан!");
      setForm({
        login: "",
        password: "",
        phoneNumber: "",
        name: "",
        surname: "",
        patronymic: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="add-admin-page">
      <h1>Добавление администратора</h1>

      <form onSubmit={handleSubmit}>
        <label>Логин</label>
        <input name="login" value={form.login} onChange={handleChange} required />

        <label>Пароль</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Телефон</label>
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleChange}
        />

        <label>Имя</label>
        <input name="name" value={form.name} onChange={handleChange} />

        <label>Фамилия</label>
        <input name="surname" value={form.surname} onChange={handleChange} />

        <label>Отчество</label>
        <input
          name="patronymic"
          value={form.patronymic}
          onChange={handleChange}
        />

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" className="primary-btn">
          Создать админа
        </button>
        <button
          type="button"
          className="outline-btn"
          style={{ marginLeft: 12 }}
          onClick={() => navigate(-1)}
        >
          Назад
        </button>
      </form>
    </div>
  );
}
