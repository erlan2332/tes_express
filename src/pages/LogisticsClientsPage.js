import React, { useEffect, useState, useMemo } from "react";
import { API_BASE } from "../config";
import "./LogisticsClientsPage.css";

function LogisticsClientsPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "status", direction: "asc" });
  const [statuses, setStatuses] = useState([]);
  const [models, setModels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [autos, setAutos] = useState([]);
  const [statusCars, setStatusCars] = useState([]);
  const [lastOrderCode, setLastOrderCode] = useState("");

  const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);


  const [formData, setFormData] = useState({
    fio: "",
    phone: "",
    region: "",
    clientCode: "ANH12",
    clientStatus: "",
    vinCode: "",
    startPlace: "",
    destination: "",
    carModel: "",
    autoId: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchDictionaries();
    fetchAutos();
  }, []);


  async function fetchDictionaries() {
    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const headers = { Authorization: `Basic ${creds}` };
      const [statusRes, modelsRes, locationsRes] = await Promise.all([
        fetch(`${API_BASE}/api/dictionary/statuses`, { headers }),
        fetch(`${API_BASE}/api/dictionary/models`, { headers }),
        fetch(`${API_BASE}/api/v1/location/locations`, { headers }),
      ]);
      setStatuses(await statusRes.json());
      setModels(await modelsRes.json());
      setLocations(await locationsRes.json());
    } catch (err) {
      setError(err.message);
    }
  }


  async function fetchAutos() {
    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const resp = await fetch(`${API_BASE}/api/auto/get/list`, {
        headers: { Authorization: `Basic ${creds}` },
      });
      const data = await resp.json();
      setAutos(data);
    } catch (err) {
      console.error("Ошибка загрузки авто:", err);
    }
  }


  async function fetchOrders() {
    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const resp = await fetch(`${API_BASE}/api/orders/my`, {
        headers: { Authorization: `Basic ${creds}` },
      });
      if (!resp.ok) {
        throw new Error(`Ошибка загрузки заказов: ${resp.status}`);
      }
      const data = await resp.json();

      
      const processedData = data.map((order) => ({
        ...order,
        contactPhone: order.contactPhone || "+996555000000",
        autos: order.autos?.map((auto) => ({
          ...auto,
          route: `${auto.currentLocation} → ${auto.destination}`,
        })),
      }));

      setOrders(processedData);
    } catch (err) {
      setError(err.message);
    }
  }


  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (sortConfig.key === "status") {
        const nameA = a.status?.name || "";
        const nameB = b.status?.name || "";
        return sortConfig.direction === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      return 0;
    });
  }, [orders, sortConfig]);


  const filteredOrders = sortedOrders.filter((o) =>
    o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
    o.description?.toLowerCase().includes(search.toLowerCase())
  );


  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };


  async function handleDeleteOrder(orderId) {
    if (!window.confirm("Вы уверены, что хотите удалить этот заказ?")) return;
    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const resp = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${creds}` },
      });
      if (!resp.ok) {
        throw new Error(`Ошибка при удалении заказа: ${resp.status}`);
      }
      await fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  }


  const handleAddClient = async () => {
    try {
      const { fio, vinCode, autoId } = formData;
      if (!fio || !vinCode || !autoId) {
        throw new Error("Заполните ФИО, VIN и выберите авто");
      }

      const creds = localStorage.getItem("basicCreds") || "";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${creds}`,
      };

      const orderBody = {
        autoIds: [parseInt(autoId)],
        description: fio,
        vin: vinCode,
      };

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderBody),
      });
      const responseText = await response.text();
      setLastOrderCode(responseText);

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} — ${responseText}`);
      }

      const getResp = await fetch(`${API_BASE}/api/orders/get-by-code`, {
        method: "POST",
        headers,
        body: JSON.stringify({ orderCode: responseText }),
      });
      const newOrder = await getResp.json();
      const processedOrder = {
        ...newOrder,
        contactPhone: newOrder.contactPhone || "+996555000000",
        autos: newOrder.autos?.map((auto) => ({
          ...auto,
          route: `${auto.currentLocation} → ${auto.destination || "?"}`,
        })),
      };

      setOrders((prev) => [processedOrder, ...prev]);
      setAddClientModalOpen(false);
      setFormData({
        fio: "",
        phone: "",
        region: "",
        clientCode: "ANH12",
        clientStatus: "",
        vinCode: "",
        startPlace: "",
        destination: "",
        carModel: "",
        autoId: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${creds}`,
      };
      await Promise.all(
        statusCars.map((car) => {
          if (!car.id) return null;
          return fetch(`${API_BASE}/api/auto/${car.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: car.status, delayReason: car.delay }),
          });
        })
      );

      await fetchOrders();
      setStatusModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="logistics-clients-page">
      <h1>Логистика</h1>
      <div className="top-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="blue-btn" onClick={() => setAddClientModalOpen(true)}>
          Добавить клиента
        </button>
        {lastOrderCode && (
          <button
            className="outline-btn"
            onClick={async () => {
              try {
                const creds = localStorage.getItem("basicCreds") || "";
                const headers = {
                  "Content-Type": "application/json",
                  Authorization: `Basic ${creds}`,
                };
                const resp = await fetch(`${API_BASE}/api/orders/get-by-code`, {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ orderCode: lastOrderCode }),
                });
                const data = await resp.json();
                alert(`Заказ найден: ${data.description || "Без описания"}`);
              } catch (err) {
                console.error("Ошибка поиска заказа по коду", err);
              }
            }}
          >
            Проверить заказ по коду ({lastOrderCode})
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}

      <table className="logistics-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Код клиента</th>
            <th>ФИО</th>
            <th>Контакт</th>
            <th onClick={() => handleSort("status")}>
              Статус{" "}
              {sortConfig.key === "status" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th>Удаление</th>
            <th>Машины</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((ord, idx) => (
            <tr key={ord.id}>
              <td>{idx + 1}</td>
              <td>{ord.orderCode}</td>
              <td>{ord.description}</td>
              <td>{ord.contactPhone}</td>
              <td>
                <span
                  className={`badge ${
                    ord.status?.name === "Нулевая"
                      ? "red"
                      : ord.status?.name === "Клиент"
                      ? "green"
                      : "blue"
                  }`}
                >
                  {ord.status?.name}
                </span>
              </td>
              <td>
                <button className="red-btn" onClick={() => handleDeleteOrder(ord.id)}>
                  Удалить
                </button>
              </td>
              <td>
                {ord.autos?.map((auto) => (
                  <div key={`auto-${auto.id}`} className="car-info">
                    <div className="model">
                      {auto.model?.brand?.name} {auto.model?.name}
                    </div>
                    <div className="route">{auto.route}</div>
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isAddClientModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Новый клиент</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>ФИО</label>
                <input
                  value={formData.fio}
                  onChange={(e) =>
                    setFormData({ ...formData, fio: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>VIN</label>
                <input
                  value={formData.vinCode}
                  onChange={(e) =>
                    setFormData({ ...formData, vinCode: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Выберите авто</label>
                <select
                  value={formData.autoId}
                  onChange={(e) =>
                    setFormData({ ...formData, autoId: e.target.value })
                  }
                >
                  <option value="">-- Выберите авто --</option>
                  {autos.map((auto) => (
                    <option key={auto.id} value={auto.id}>
                      {auto.id} - {auto.model?.brand?.name} {auto.model?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="blue-btn" onClick={handleAddClient}>
                Сохранить
              </button>
              <button
                className="outline-btn"
                onClick={() => setAddClientModalOpen(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      {isStatusModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Обновление статусов машин</h2>
            <button className="blue-btn" onClick={handleStatusUpdate}>
              Сохранить
            </button>
            <button
              className="outline-btn"
              onClick={() => setStatusModalOpen(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogisticsClientsPage;
