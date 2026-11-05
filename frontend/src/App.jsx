import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AdvocateAuth from "./pages/Advocate/AdvocateAuth";
import AdvocateDashboard from "./pages/Advocate/AdvocateDashboard";
import NewCase from "./pages/advocate/NewCase";
import MyCases from "./pages/advocate/MyCases";
import SummaryPage from "./pages/Advocate/SummaryPage";
import AdvocateProfile from "./pages/Advocate/AdvocateProfile";
import AIAnalysis from "./pages/advocate/AIAnalysis";
import CaseAnalyticsView from "./pages/advocate/CaseAnalyticsView";
import CaseDetail from "./pages/advocate/CaseDetail";
import PdfLibrary from "./pages/advocate/PdfLibrary";




import ClientAuth from "./pages/client/ClientAuth";
import ClientDashboard from "./pages/client/ClientDashboard";

import AdminAuth from "./pages/admin/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Advocate */}
        <Route path="/advocate" element={<AdvocateAuth />} />
        <Route path="/advocate/dashboard" element={<AdvocateDashboard />} />
         <Route path="/advocate/my-cases" element={<MyCases />} />
        {/* <Route path="/advocate/case/:id" element={<CaseDetails />} /> */}
        <Route path="/summary" element={<SummaryPage />}/>
        <Route path="/advocate/profile" element={<AdvocateProfile />}/>
        <Route path="/advocate/analysis" element={<AIAnalysis />}/>
        <Route path="/advocate/analytics" element={<CaseAnalyticsView />} />
        <Route path="/advocate/case/:id" element={<CaseDetail />} />
        <Route path="/advocate/documents" element={<PdfLibrary />} />
       



        {/* Client */}
        <Route path="/client" element={<ClientAuth />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />

        <Route path="/advocate/new-case" element={<NewCase />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminAuth />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;