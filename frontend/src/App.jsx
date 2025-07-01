import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SetupMFA from "./pages/SetupMFA";
import VerifyMFA from "./pages/VerifyMFA";
import Home from "./pages/Home";
// importe aussi Dashboard, etc.

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup-mfa" element={<SetupMFA />} />
        <Route path="/verify-mfa" element={<VerifyMFA />} />
        <Route path="/home" element={<Home />} />
        {/* autres routes ici */}
      </Routes>
    </Router>
  );
}

export default App;
