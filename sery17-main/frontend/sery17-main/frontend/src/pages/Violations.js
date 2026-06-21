import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ViolationsModal from '../components/ViolationsModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function Violations({ user, onLogout }) {
  const [projectGovs, setProjectGovs] = useState({});

  useEffect(() => {
    const fetchProjectGovs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/project-governorates`, { headers: { Authorization: `Bearer ${token}` } });
        setProjectGovs(res.data || {});
      } catch (err) {
        console.error('Failed to fetch project governorates', err);
      }
    };
    fetchProjectGovs();
  }, []);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto h-[85vh] flex flex-col">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <ViolationsModal isFullScreen={true} user={user} projectGovs={projectGovs} />
        </div>
      </div>
    </Layout>
  );
}

export default Violations;
