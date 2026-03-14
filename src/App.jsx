import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, User, Activity, FileText, CheckCircle, 
  Download, Printer, X, PlusCircle, Edit3
} from 'lucide-react';

// --- 工具函數 ---
const generateTimestamp = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const generateRecordId = (timestamp) => {
  return `PT-${timestamp.replace(/[- :]/g, '')}`;
};

// --- SVG 人體部位定義 (對應上傳圖片的細緻分塊) ---
const bodyRegions = [
  { id: 'head', name: '頭部', d: "M 85,20 C 85,-5 115,-5 115,20 C 115,50 105,60 100,60 C 95,60 85,50 85,20 Z" },
  { id: 'neck', name: '頸椎', d: "M 92,57 L 108,57 L 115,75 L 85,75 Z" },
  { id: 'chest', name: '胸椎/上背', d: "M 85,75 L 115,75 L 145,90 L 130,160 L 70,160 L 55,90 Z" },
  { id: 'abdomen', name: '腰椎/骨盆', d: "M 70,160 L 130,160 L 125,230 L 100,250 L 75,230 Z" },
  { id: 'pt-r-upper', name: '右上臂 (患者)', d: "M 55,90 C 35,95 30,110 35,130 L 45,180 L 65,170 L 70,160 Z" },
  { id: 'pt-r-lower', name: '右前臂 (患者)', d: "M 45,180 L 35,250 L 55,255 L 65,170 Z" },
  { id: 'pt-r-hand', name: '右手 (患者)', d: "M 35,250 L 25,290 L 50,295 L 55,255 Z" },
  { id: 'pt-l-upper', name: '左上臂 (患者)', d: "M 145,90 C 165,95 170,110 165,130 L 155,180 L 135,170 L 130,160 Z" },
  { id: 'pt-l-lower', name: '左前臂 (患者)', d: "M 155,180 L 165,250 L 145,255 L 135,170 Z" },
  { id: 'pt-l-hand', name: '左手 (患者)', d: "M 165,250 L 175,290 L 150,295 L 145,255 Z" },
  { id: 'pt-r-thigh', name: '右大腿 (患者)', d: "M 75,230 L 100,250 L 95,330 L 65,320 Z" },
  { id: 'pt-r-calf', name: '右小腿 (患者)', d: "M 65,320 L 95,330 L 85,420 L 60,410 Z" },
  { id: 'pt-r-foot', name: '右腳 (患者)', d: "M 60,410 L 85,420 L 80,450 L 50,440 Z" },
  { id: 'pt-l-thigh', name: '左大腿 (患者)', d: "M 125,230 L 100,250 L 105,330 L 135,320 Z" },
  { id: 'pt-l-calf', name: '左小腿 (患者)', d: "M 135,320 L 105,330 L 115,420 L 140,410 Z" },
  { id: 'pt-l-foot', name: '左腳 (患者)', d: "M 140,410 L 115,420 L 120,450 L 150,440 Z" },
];

const regionJointMap = {
  'head': ['頸椎 (C-Spine)', '顳顎關節 (TMJ)'],
  'neck': ['頸椎 (C-Spine)', '胸椎 (T-Spine)', '肩關節 (右)', '肩關節 (左)'],
  'chest': ['胸椎 (T-Spine)', '頸椎 (C-Spine)', '腰椎 (L-Spine)', '肩關節 (右)', '肩關節 (左)'],
  'abdomen': ['腰椎 (L-Spine)', '胸椎 (T-Spine)', '骨盆/薦髂關節 (SIJ)', '髖關節 (右)', '髖關節 (左)'],
  'pt-r-upper': ['肩關節 (右)', '肘關節 (右)', '頸椎 (C-Spine)'],
  'pt-r-lower': ['肘關節 (右)', '腕關節 (右)'],
  'pt-r-hand': ['腕關節 (右)', '手指關節 (右)'],
  'pt-l-upper': ['肩關節 (左)', '肘關節 (左)', '頸椎 (C-Spine)'],
  'pt-l-lower': ['肘關節 (左)', '腕關節 (左)'],
  'pt-l-hand': ['腕關節 (左)', '手指關節 (左)'],
  'pt-r-thigh': ['髖關節 (右)', '膝關節 (右)', '骨盆/薦髂關節 (SIJ)'],
  'pt-r-calf': ['膝關節 (右)', '踝關節 (右)'],
  'pt-r-foot': ['踝關節 (右)', '腳趾關節 (右)'],
  'pt-l-thigh': ['髖關節 (左)', '膝關節 (左)', '骨盆/薦髂關節 (SIJ)'],
  'pt-l-calf': ['膝關節 (左)', '踝關節 (左)'],
  'pt-l-foot': ['踝關節 (左)', '腳趾關節 (左)'],
};

const allJointsList = [
  '頸椎 (C-Spine)', '胸椎 (T-Spine)', '腰椎 (L-Spine)', '骨盆/薦髂關節 (SIJ)', '顳顎關節 (TMJ)',
  '肩關節 (右)', '肘關節 (右)', '腕關節 (右)', '手指關節 (右)',
  '肩關節 (左)', '肘關節 (左)', '腕關節 (左)', '手指關節 (左)',
  '髖關節 (右)', '膝關節 (右)', '踝關節 (右)', '腳趾關節 (右)',
  '髖關節 (左)', '膝關節 (左)', '踝關節 (左)', '腳趾關節 (左)'
];

// 次分頁設定
const subTabsConfig = {
  'S': ['基本資料與診斷', 'Body Chart', '病史與目標'],
  'O': ['觀察與姿勢', '關節活動度 (ROM)', '理學與特殊測試'],
  'A': ['診斷與預後', '問題列表'],
  'P': ['治療目標', '治療方案與衛教']
};

export default function App() {
  const [timestamp, setTimestamp] = useState('');
  const [recordId, setRecordId] = useState('');
  
  // 導航狀態
  const [activeTab, setActiveTab] = useState('S');
  const [activeSubTab, setActiveSubTab] = useState(0);

  // --- 驗證狀態 ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    const ts = generateTimestamp();
    setTimestamp(ts);
    setRecordId(generateRecordId(ts));
  }, []);

  // --- 處理 PIN 碼解鎖 ---
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '427088') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('PIN 碼錯誤，請重新輸入');
      setPinInput('');
    }
  };

  // 切換主 Tab 時，重置次 Tab 為 0
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveSubTab(0);
  };

  // --- 核心資料狀態 ---
  const [formData, setFormData] = useState({
    subjective: {
      name: '', age: '', gender: 'M', date: new Date().toISOString().split('T')[0],
      height: '', weight: '', chiefComplaint: '', medDx: '', medTx: '',
      symptoms: [], 
      healthGeneral: '', healthMeds: '',
      psychosocial: '', adl: '',
      dominantSide: 'R', patientGoal: ''
    },
    objective: {
      observation: {
        '疤痕 (Scar)': { checked: false, text: '' },
        '溫度異常': { checked: false, text: '' },
        '顏色異常': { checked: false, text: '' },
        '異常張力 (Tension)': { checked: false, text: '' },
        '激痛點 (Trigger Point)': { checked: false, text: '' },
        '腫脹 (Swelling)': { checked: false, text: '' },
        '肌肉萎縮 (Atrophy)': { checked: false, text: '' }
      },
      postureFront: { photo1: null, photo2: null, head: '', upperLimb: '', torso: '', pelvis: '', lowerLimb: '' },
      postureSide: { photo1: null, photo2: null, head: '', upperLimb: '', torso: '', pelvis: '', lowerLimb: '' },
      rom: {}, 
      tests: {
        accessory: '',
        mmt: '',
        muscleLength: '',
        motorControl: '',
        neuroTension: '',
        neuroExam: '',
        special: ''
      }
    },
    assessment: {
      clinicalDx: '', problemList: [''], prognosis: '', prognosisDesc: ''
    },
    plan: {
      stg: '', ltg: '', treatmentPlan: [''], homeProgram: ''
    }
  });

  // --- 互動狀態 ---
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [currentSymptom, setCurrentSymptom] = useState({
    type: '', locationDesc: '', vas: 5, aggr: '', ease: '', freq: '間歇', dayNight: '皆有'
  });
  const symptomTypesList = ['針刺', '麻木', '無力', '瞬間無力', '緊繃', '痠', '燒灼', '單點銳痛', '模糊鈍痛'];

  // --- 更新一般資料函數 ---
  const updateData = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const updateNestedData = (section, nestedSection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...prev[section][nestedSection],
          [field]: value
        }
      }
    }));
  };

  // --- 陣列資料更新函數 (Problem List, Treatment Plan) ---
  const updateArrayData = (section, field, index, value) => {
    const newList = [...formData[section][field]];
    newList[index] = value;
    updateData(section, field, newList);
  };
  const addArrayItem = (section, field) => {
    updateData(section, field, [...formData[section][field], '']);
  };
  const removeArrayItem = (section, field, index) => {
    const newList = formData[section][field].filter((_, i) => i !== index);
    if (newList.length === 0) newList.push(''); // 保留至少一行
    updateData(section, field, newList);
  };

  // --- 觀察與觸診 更新邏輯 ---
  const toggleObservation = (key) => {
    const current = formData.objective.observation[key];
    updateNestedData('objective', 'observation', key, { ...current, checked: !current.checked });
  };
  const updateObservationText = (key, text) => {
    const current = formData.objective.observation[key];
    updateNestedData('objective', 'observation', key, { ...current, text });
  };
  const activeObservations = Object.entries(formData.objective.observation).filter(([k, v]) => v.checked);

  // --- 姿勢照片上傳邏輯 ---
  const handlePhotoUpload = (section, photoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNestedData('objective', section, photoKey, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Body Chart 邏輯 ---
  const handleRegionClick = (region) => {
    setSelectedRegion(region);
    const existing = formData.subjective.symptoms.find(s => s.regionId === region.id);
    if (existing) setCurrentSymptom(existing);
    else setCurrentSymptom({ type: '', locationDesc: '', vas: 5, aggr: '', ease: '', freq: '間歇', dayNight: '皆有' });
    setIsSymptomModalOpen(true);
  };

  const saveSymptom = () => {
    const newSymptom = { ...currentSymptom, regionId: selectedRegion.id, regionName: selectedRegion.name };
    const filtered = formData.subjective.symptoms.filter(s => s.regionId !== selectedRegion.id);
    let newSymptoms = [];
    
    if (currentSymptom.type || currentSymptom.aggr) {
      newSymptoms = [...filtered, newSymptom];
    } else {
      newSymptoms = filtered;
    }
    updateData('subjective', 'symptoms', newSymptoms);
    syncRomWithSymptoms(newSymptoms);
    setIsSymptomModalOpen(false);
  };

  const removeSymptom = (regionId) => {
    const newSymptoms = formData.subjective.symptoms.filter(s => s.regionId !== regionId);
    updateData('subjective', 'symptoms', newSymptoms);
    syncRomWithSymptoms(newSymptoms);
  };

  // --- ROM 動態計算邏輯 ---
  const syncRomWithSymptoms = (symptoms) => {
    const activeJoints = new Set();
    symptoms.forEach(s => {
      const joints = regionJointMap[s.regionId] || [];
      joints.forEach(j => activeJoints.add(j));
    });
    
    const newRom = {};
    const currentRom = formData.objective.rom;
    
    Object.keys(currentRom).forEach(key => { newRom[key] = currentRom[key]; });
    activeJoints.forEach(joint => { if (!(joint in newRom)) newRom[joint] = ''; });

    updateData('objective', 'rom', newRom);
  };

  const manuallyAddRomJoint = (e) => {
    const joint = e.target.value;
    if (joint && !(joint in formData.objective.rom)) {
      updateData('objective', 'rom', { ...formData.objective.rom, [joint]: '' });
    }
    e.target.value = ''; 
  };

  const removeRomJoint = (joint) => {
    const newRom = { ...formData.objective.rom };
    delete newRom[joint];
    updateData('objective', 'rom', newRom);
  };

  // --- 匯出功能 ---
  const exportExcel = async () => {
    setIsExporting(true);
    setExportMessage('正在生成 Excel...');
    try {
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const wb = window.XLSX.utils.book_new();

      // Sheet S
      const dataS = [
        ['病歷編號', recordId], ['治療日期', formData.subjective.date], ['建立時間', timestamp], [],
        ['--- 基本資料與診斷 ---'],
        ['姓名', formData.subjective.name], ['年齡', formData.subjective.age], ['性別', formData.subjective.gender === 'M' ? '男' : '女'],
        ['身高(cm)', formData.subjective.height], ['體重(kg)', formData.subjective.weight],
        ['主述病史', formData.subjective.chiefComplaint], ['藥物使用狀況', formData.subjective.healthMeds],
        ['醫師診斷', formData.subjective.medDx], ['醫師處置', formData.subjective.medTx], [],
        ['--- Body Chart ---'],
        ...formData.subjective.symptoms.map(s => ['症狀部位', s.regionName, '性質', s.type, '詳細位置', s.locationDesc, 'VAS', s.vas, '加劇', s.aggr, '減緩', s.ease]), [],
        ['--- 病史與目標 ---'],
        ['整體健康狀況', formData.subjective.healthGeneral], ['社會心理', formData.subjective.psychosocial], ['日常活動', formData.subjective.adl],
        ['慣用側', formData.subjective.dominantSide === 'R' ? '右側' : '左側'], ['期望目標', formData.subjective.patientGoal]
      ];
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(dataS), "主觀(S)");

      // Sheet O
      const dataO = [
        ['病歷編號', recordId], [],
        ['--- 觀察與觸診 ---'],
        ...Object.entries(formData.objective.observation).filter(([k, v]) => v.checked).map(([k, v]) => ['觀察項目', k, '描述', v.text]), [],
        ['--- 姿勢評估 (前後觀) ---'],
        ['頭部', formData.objective.postureFront.head], ['上肢', formData.objective.postureFront.upperLimb], ['軀幹', formData.objective.postureFront.torso], ['骨盆', formData.objective.postureFront.pelvis], ['下肢', formData.objective.postureFront.lowerLimb], [],
        ['--- 姿勢評估 (側面觀) ---'],
        ['頭部', formData.objective.postureSide.head], ['上肢', formData.objective.postureSide.upperLimb], ['軀幹', formData.objective.postureSide.torso], ['骨盆', formData.objective.postureSide.pelvis], ['下肢', formData.objective.postureSide.lowerLimb], [],
        ['--- 關節活動度 (ROM) ---'],
        ...Object.entries(formData.objective.rom).map(([k, v]) => ['關節', k, '數值', v]), [],
        ['--- 理學與特殊測試 ---'],
        ...Object.entries(formData.objective.tests).map(([k, v]) => {
          const labels = { accessory: '關節內動作', mmt: '徒手肌力測試', muscleLength: '肌肉長度測試', motorControl: '動作控制測試', neuroTension: '神經張力測試', neuroExam: '神經學檢查', special: '特殊測試' };
          return ['測試', labels[k], '結果', v];
        })
      ];
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(dataO), "客觀(O)");

      // Sheet A
      const dataA = [
        ['病歷編號', recordId], [],
        ['--- 診斷與預後 ---'],
        ['物理治療臨床診斷', formData.assessment.clinicalDx],
        ['預後潛力', formData.assessment.prognosis, '詳細描述', formData.assessment.prognosisDesc], [],
        ['--- 問題列表 ---'],
        ...formData.assessment.problemList.map((p, i) => [`問題 ${i+1}`, p])
      ];
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(dataA), "評估(A)");

      // Sheet P
      const dataP = [
        ['病歷編號', recordId], [],
        ['--- 治療目標 ---'],
        ['短期目標', formData.plan.stg],
        ['長期目標', formData.plan.ltg], [],
        ['--- 治療方案 ---'],
        ...formData.plan.treatmentPlan.map((p, i) => [`方案 ${i+1}`, p]), [],
        ['--- 自我管理與居家運動 ---'],
        ['內容', formData.plan.homeProgram]
      ];
      window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(dataP), "計畫(P)");

      window.XLSX.writeFile(wb, `${recordId}_PT_Record.xlsx`);
    } catch (error) {
      console.error("Excel Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    setExportMessage('正在生成 PDF...');
    // 給予 React 渲染所有標籤頁的時間
    setTimeout(async () => {
      try {
        if (!window.html2pdf) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const element = document.getElementById('pdf-content');
        const opt = {
          margin:       [10, 10, 10, 10],
          filename:     `${recordId}_PT_Record.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, windowWidth: 1024 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await window.html2pdf().set(opt).from(element).save();
      } catch (error) {
        console.error("PDF Export failed:", error);
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  // --- 渲染 ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">PT 臨床紀錄系統</h1>
          <p className="text-gray-500 mb-6 text-sm">請輸入 PIN 碼以解鎖</p>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              className="w-full text-center text-3xl tracking-[0.25em] border-2 border-gray-200 rounded-lg p-3 mb-2 focus:border-blue-500 focus:outline-none"
              placeholder="••••••"
            />
            <div className="h-6 mb-2">
              {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              解鎖進入
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {!isExporting && (
        <header className="bg-blue-600 text-white p-4 shadow-md print:hidden sticky top-0 z-40">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity size={24} /> PT 臨床紀錄
            </h1>
            <div className="flex gap-3">
              <button onClick={exportPDF} className="p-2 bg-blue-500 rounded-full hover:bg-blue-400"><Printer size={18} /></button>
              <button onClick={exportExcel} className="p-2 bg-blue-500 rounded-full hover:bg-blue-400"><Download size={18} /></button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-sm text-blue-100 flex justify-between">
            <span>ID: {recordId}</span>
            <span>{timestamp}</span>
          </div>
        </header>
      )}

      {/* 主標籤頁 */}
      {!isExporting && (
        <div className="max-w-4xl mx-auto mt-4 px-2 print:hidden">
          <div className="flex bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {['S', 'O', 'A', 'P'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 py-3 text-center font-semibold transition-colors ${
                  activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'S' ? '主觀 (S)' : tab === 'O' ? '客觀 (O)' : tab === 'A' ? '評估 (A)' : '計畫 (P)'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div id="pdf-content" className={isExporting ? "bg-white p-6" : ""}>
        <div className={`${isExporting ? 'block' : 'hidden print:block'} p-8 pb-0 text-center border-b mb-6`}>
          <h1 className="text-2xl font-bold">物理治療臨床評估紀錄表 (SOAP)</h1>
          <p className="text-gray-500 mt-2">病歷號: {recordId} | 日期: {timestamp}</p>
        </div>

        <main className="max-w-4xl mx-auto mt-4 px-2 print:p-0">
          <div className={`bg-white rounded-xl ${isExporting ? '' : 'shadow-sm p-4 border border-gray-200'} print:shadow-none print:p-8 print:border-none`}>
            
            {/* ================================= S: Subjective ================================= */}
            <div className={`${(activeTab === 'S' || isExporting) ? 'block' : 'hidden print:block'} print:mb-8 mb-8`}>
              <h2 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2 border-b pb-2">
                <User size={20} /> 主觀評估 (Subjective)
              </h2>

              {/* 次級導航列 (進度條) */}
              {!isExporting && (
                <div className="flex justify-center items-center gap-1 mb-6 print:hidden">
                  {subTabsConfig['S'].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSubTab(idx)}
                      className="p-3 focus:outline-none touch-manipulation"
                      aria-label={`切換至子頁面 ${idx + 1}`}
                    >
                      <div className={`h-3 rounded-full transition-all duration-300 shadow-sm ${activeSubTab === idx ? 'w-12 bg-blue-600' : 'w-4 bg-gray-300 hover:bg-gray-400'}`} />
                    </button>
                  ))}
                </div>
              )}
              
              <div className="space-y-6">
                {/* 頁面 S-0：基本資料與診斷 */}
                {(activeSubTab === 0 || isExporting) && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-1">姓名</label>
                        <input type="text" className="w-full border rounded-lg p-2 bg-gray-50" value={formData.subjective.name} onChange={e => updateData('subjective', 'name', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">年齡</label>
                        <input type="number" className="w-full border rounded-lg p-2 bg-gray-50" value={formData.subjective.age} onChange={e => updateData('subjective', 'age', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">性別</label>
                        <select className="w-full border rounded-lg p-2 bg-gray-50" value={formData.subjective.gender} onChange={e => updateData('subjective', 'gender', e.target.value)}>
                          <option value="M">男</option>
                          <option value="F">女</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">身高 (cm)</label>
                        <input type="number" className="w-full border rounded-lg p-2 bg-gray-50" value={formData.subjective.height} onChange={e => updateData('subjective', 'height', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">體重 (kg)</label>
                        <input type="number" className="w-full border rounded-lg p-2 bg-gray-50" value={formData.subjective.weight} onChange={e => updateData('subjective', 'weight', e.target.value)} />
                      </div>
                      <div className="col-span-2 md:col-span-6">
                        <label className="block text-sm text-gray-500 mb-1">治療日期</label>
                        <input type="date" className="w-full border rounded-lg p-2 bg-gray-50" value={formData.subjective.date} onChange={e => updateData('subjective', 'date', e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">主述病史</label>
                        <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[120px]" value={formData.subjective.chiefComplaint} onChange={e => updateData('subjective', 'chiefComplaint', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">藥物使用狀況</label>
                        <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[120px]" value={formData.subjective.healthMeds} onChange={e => updateData('subjective', 'healthMeds', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">醫師診斷</label>
                        <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[120px]" value={formData.subjective.medDx} onChange={e => updateData('subjective', 'medDx', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">醫師處置 (影像學/手術)</label>
                        <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[120px]" value={formData.subjective.medTx} onChange={e => updateData('subjective', 'medTx', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 頁面 S-1：Body Chart */}
                {isExporting && <div className="html2pdf__page-break"></div>}
                {(activeSubTab === 1 || isExporting) && (
                  <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/30">
                    <label className="block font-semibold text-gray-700 mb-2">Body Chart</label>
                    <p className="text-xs text-gray-500 mb-4 print:hidden">點選部位進行標記。資料將自動連動客觀評估之鄰近關節。</p>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="relative w-full md:w-2/5 flex justify-center bg-gray-100 p-4 rounded-lg border shadow-inner print:hidden">
                        <svg viewBox="0 0 200 460" className="w-64 md:w-72 max-w-full h-auto cursor-pointer drop-shadow-md touch-manipulation">
                          {bodyRegions.map(region => {
                            const isSelected = formData.subjective.symptoms.some(s => s.regionId === region.id);
                            return (
                              <path
                                key={region.id}
                                d={region.d}
                                fill={isSelected ? '#ef4444' : '#f8a59b'}
                                stroke="#ffffff"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                className="hover:fill-red-300 transition-colors"
                                onClick={() => handleRegionClick(region)}
                              />
                            );
                          })}
                        </svg>
                      </div>

                      <div className="w-full md:w-3/5 space-y-3">
                        {formData.subjective.symptoms.length === 0 ? (
                          <div className="text-gray-400 text-sm italic text-center p-8 border border-dashed rounded-lg">
                            尚未標記任何症狀區域
                          </div>
                        ) : (
                          formData.subjective.symptoms.map(s => (
                            <div key={s.regionId} className="bg-white p-3 rounded-lg border border-red-200 shadow-sm flex flex-col relative">
                              <button onClick={() => removeSymptom(s.regionId)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 print:hidden">
                                <X size={16} />
                              </button>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">{s.regionName}</span>
                                <span className="text-sm font-semibold">{s.type || '未指定性質'}</span>
                              </div>
                              <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                                {s.locationDesc && <div className="col-span-2"><span className="text-gray-400">詳細位置:</span> {s.locationDesc}</div>}
                                <div><span className="text-gray-400">VAS:</span> {s.vas}/10</div>
                                <div><span className="text-gray-400">頻率:</span> {s.freq} ({s.dayNight})</div>
                                {s.aggr && <div className="col-span-2"><span className="text-gray-400">加劇因子:</span> {s.aggr}</div>}
                                {s.ease && <div className="col-span-2"><span className="text-gray-400">減緩因子:</span> {s.ease}</div>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 頁面 S-2：病史與目標 */}
                {isExporting && <div className="html2pdf__page-break"></div>}
                {(activeSubTab === 2 || isExporting) && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">整體健康狀況與病史</label>
                        <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[120px]" value={formData.subjective.healthGeneral} onChange={e => updateData('subjective', 'healthGeneral', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">社會心理（工作與家庭）</label>
                        <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[120px]" value={formData.subjective.psychosocial} onChange={e => updateData('subjective', 'psychosocial', e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-1">日常活動 (ADL)</label>
                        <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[120px]" value={formData.subjective.adl} onChange={e => updateData('subjective', 'adl', e.target.value)} />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border shrink-0 md:w-1/4">
                        <label className="block text-sm text-gray-600 font-medium mb-3">慣用側</label>
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="dom" checked={formData.subjective.dominantSide==='L'} onChange={()=>updateData('subjective', 'dominantSide', 'L')} className="w-4 h-4 text-blue-600" /> <span className="text-gray-700">左側</span></label>
                          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="dom" checked={formData.subjective.dominantSide==='R'} onChange={()=>updateData('subjective', 'dominantSide', 'R')} className="w-4 h-4 text-blue-600" /> <span className="text-gray-700">右側</span></label>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border flex flex-col flex-1">
                        <label className="block text-sm text-gray-600 font-medium mb-2">期望目標</label>
                        <textarea className="w-full flex-1 border rounded-lg p-3 bg-white min-h-[80px]" value={formData.subjective.patientGoal} onChange={e => updateData('subjective', 'patientGoal', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================================= O: Objective ================================= */}
            {isExporting && <div className="html2pdf__page-break"></div>}
            <div className={`${(activeTab === 'O' || isExporting) ? 'block' : 'hidden print:block'} print:mb-8 mb-8`}>
              <h2 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2 border-b pb-2">
                <ClipboardList size={20} /> 客觀評估 (Objective)
              </h2>

              {/* 次級導航列 (進度條) */}
              {!isExporting && (
                <div className="flex justify-center items-center gap-1 mb-6 print:hidden">
                  {subTabsConfig['O'].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSubTab(idx)}
                      className="p-3 focus:outline-none touch-manipulation"
                      aria-label={`切換至子頁面 ${idx + 1}`}
                    >
                      <div className={`h-3 rounded-full transition-all duration-300 shadow-sm ${activeSubTab === idx ? 'w-12 bg-blue-600' : 'w-4 bg-gray-300 hover:bg-gray-400'}`} />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-6">
                {/* 頁面 O-0：觀察與姿勢 */}
                {(activeSubTab === 0 || isExporting) && (
                  <div className="space-y-6">
                    {/* 觀察與觸診 - 彈出式設計 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block font-semibold text-gray-700">觀察與觸診</label>
                        <button onClick={() => setIsObsModalOpen(true)} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 print:hidden">
                          <PlusCircle size={16} /> 新增
                        </button>
                      </div>
                      
                      {activeObservations.length === 0 ? (
                        <div className="text-gray-400 text-sm italic p-4 border border-dashed rounded-lg bg-gray-50">
                          尚未新增觀察與觸診項目
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {activeObservations.map(([k, v]) => (
                            <div key={k} className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm w-full md:w-auto md:min-w-[200px]">
                              <span className="font-bold text-blue-800 block mb-1">{k}</span>
                              <span className="text-gray-600 whitespace-pre-wrap">{v.text || '(無詳細描述)'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 姿勢評估 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 前後觀 */}
                      <div className="border rounded-xl p-4 bg-gray-50 shadow-sm">
                        <div className="mb-4">
                          <label className="block font-bold text-gray-700">姿勢評估 (前後觀)</label>
                        </div>
                        
                        {/* 雙照片區塊 */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {[1, 2].map((num) => {
                            const pKey = `photo${num}`;
                            return (
                              <div key={pKey} className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center relative flex flex-col justify-center items-center min-h-[140px] bg-white">
                                {formData.objective.postureFront[pKey] ? (
                                  <>
                                    <img src={formData.objective.postureFront[pKey]} alt={`前後觀 ${num}`} className="max-h-32 mx-auto object-contain rounded" />
                                    <button onClick={() => updateNestedData('objective', 'postureFront', pKey, null)} className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 shadow hover:bg-red-50 print:hidden"><X size={16}/></button>
                                  </>
                                ) : (
                                  <label className="cursor-pointer text-sm text-gray-500 hover:text-blue-600 flex flex-col items-center w-full h-full justify-center print:hidden">
                                    <PlusCircle size={24} className="mb-1 text-gray-400" />
                                    <span>照片 {num}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload('postureFront', pKey, e)} />
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-3">
                          {[
                            { key: 'head', label: '頭部' },
                            { key: 'upperLimb', label: '上肢' },
                            { key: 'torso', label: '軀幹' },
                            { key: 'pelvis', label: '骨盆' },
                            { key: 'lowerLimb', label: '下肢' }
                          ].map(part => (
                            <div key={`front-${part.key}`}>
                              <span className="block text-sm text-gray-500 mb-1">{part.label}</span>
                              <textarea 
                                className="w-full border rounded-lg p-2 bg-white min-h-[60px] text-sm" 
                                value={formData.objective.postureFront[part.key]} 
                                onChange={e => updateNestedData('objective', 'postureFront', part.key, e.target.value)} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 側面觀 */}
                      <div className="border rounded-xl p-4 bg-gray-50 shadow-sm">
                        <div className="mb-4">
                          <label className="block font-bold text-gray-700">姿勢評估 (側面觀)</label>
                        </div>

                        {/* 雙照片區塊 */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {[1, 2].map((num) => {
                            const pKey = `photo${num}`;
                            return (
                              <div key={pKey} className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center relative flex flex-col justify-center items-center min-h-[140px] bg-white">
                                {formData.objective.postureSide[pKey] ? (
                                  <>
                                    <img src={formData.objective.postureSide[pKey]} alt={`側面觀 ${num}`} className="max-h-32 mx-auto object-contain rounded" />
                                    <button onClick={() => updateNestedData('objective', 'postureSide', pKey, null)} className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 shadow hover:bg-red-50 print:hidden"><X size={16}/></button>
                                  </>
                                ) : (
                                  <label className="cursor-pointer text-sm text-gray-500 hover:text-blue-600 flex flex-col items-center w-full h-full justify-center print:hidden">
                                    <PlusCircle size={24} className="mb-1 text-gray-400" />
                                    <span>照片 {num}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload('postureSide', pKey, e)} />
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-3">
                          {[
                            { key: 'head', label: '頭部' },
                            { key: 'upperLimb', label: '上肢' },
                            { key: 'torso', label: '軀幹' },
                            { key: 'pelvis', label: '骨盆' },
                            { key: 'lowerLimb', label: '下肢' }
                          ].map(part => (
                            <div key={`side-${part.key}`}>
                              <span className="block text-sm text-gray-500 mb-1">{part.label}</span>
                              <textarea 
                                className="w-full border rounded-lg p-2 bg-white min-h-[60px] text-sm" 
                                value={formData.objective.postureSide[part.key]} 
                                onChange={e => updateNestedData('objective', 'postureSide', part.key, e.target.value)} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 頁面 O-1：關節活動度 */}
                {isExporting && <div className="html2pdf__page-break"></div>}
                {(activeSubTab === 1 || isExporting) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-semibold text-gray-700">關節活動度 (ROM)</label>
                      <div className="flex items-center gap-2 print:hidden">
                        <span className="text-xs text-gray-500">從人體圖連動，或</span>
                        <select className="border text-sm p-1 rounded bg-white text-gray-600 focus:outline-none" onChange={manuallyAddRomJoint} defaultValue="">
                          <option value="" disabled>+ 新增其他關節</option>
                          {allJointsList.filter(j => !(j in formData.objective.rom)).map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {Object.keys(formData.objective.rom).length === 0 ? (
                      <div className="text-gray-400 text-sm italic p-6 border border-dashed rounded-lg bg-gray-50 text-center">
                        請先於「主觀評估」標記人體圖，系統將自動列出目標部位與其鄰近關節。或使用右上方選單手動新增。
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.keys(formData.objective.rom).map(joint => (
                          <div key={joint} className="flex items-center border rounded-lg overflow-hidden bg-white ring-1 ring-blue-100 relative">
                            <span className="w-36 px-3 py-2 text-sm font-medium border-r bg-blue-50 text-blue-800">
                              {joint}
                            </span>
                            <input 
                              type="text" 
                              className="flex-1 p-2 bg-transparent text-sm focus:outline-none" 
                              value={formData.objective.rom[joint]}
                              onChange={(e) => updateData('objective', 'rom', { ...formData.objective.rom, [joint]: e.target.value })}
                            />
                            <button onClick={() => removeRomJoint(joint)} className="p-2 text-gray-400 hover:text-red-500 print:hidden absolute right-0">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 頁面 O-2：各項測試 */}
                {isExporting && <div className="html2pdf__page-break"></div>}
                {(activeSubTab === 2 || isExporting) && (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-3">各項理學與特殊測試</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                      {[
                        { key: 'accessory', label: '關節內動作 (Accessory Movement)' },
                        { key: 'mmt', label: '徒手肌力測試 (MMT)' },
                        { key: 'muscleLength', label: '肌肉長度測試 (Muscle Length)' },
                        { key: 'motorControl', label: '動作控制測試 (Motor Control)' },
                        { key: 'neuroTension', label: '神經張力測試 (Neural Tension)' },
                        { key: 'neuroExam', label: '神經學檢查 (Neurological Test)' },
                        { key: 'special', label: '特殊測試 (Special Tests)' },
                      ].map(test => (
                        <div key={test.key} className={test.key === 'special' ? "md:col-span-2" : ""}>
                          <label className="block text-sm font-medium text-gray-600 mb-1">{test.label}</label>
                          <textarea 
                            className="w-full border rounded-lg p-3 bg-white text-sm min-h-[100px]" 
                            rows="3"
                            value={formData.objective.tests[test.key]} 
                            onChange={e => updateNestedData('objective', 'tests', test.key, e.target.value)} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================================= A: Assessment ================================= */}
            {isExporting && <div className="html2pdf__page-break"></div>}
            <div className={`${(activeTab === 'A' || isExporting) ? 'block' : 'hidden print:block'} print:mb-8 mb-8`}>
              <h2 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2 border-b pb-2">
                <FileText size={20} /> 臨床診斷與評估 (Assessment)
              </h2>

              {/* 次級導航列 (進度條) */}
              {!isExporting && (
                <div className="flex justify-center items-center gap-1 mb-6 print:hidden">
                  {subTabsConfig['A'].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSubTab(idx)}
                      className="p-3 focus:outline-none touch-manipulation"
                      aria-label={`切換至子頁面 ${idx + 1}`}
                    >
                      <div className={`h-3 rounded-full transition-all duration-300 shadow-sm ${activeSubTab === idx ? 'w-12 bg-blue-600' : 'w-4 bg-gray-300 hover:bg-gray-400'}`} />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-6">
                {/* 頁面 A-0：診斷與預後 */}
                {(activeSubTab === 0 || isExporting) && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">物理治療臨床診斷</label>
                      <textarea className="w-full border rounded-lg p-3 bg-gray-50 shadow-sm min-h-[150px]" value={formData.assessment.clinicalDx} onChange={e => updateData('assessment', 'clinicalDx', e.target.value)} />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">預後潛力 (Prognosis)</label>
                      <div className="flex flex-col md:flex-row gap-4">
                        <select className="w-full md:w-1/3 border rounded-lg p-3 bg-gray-50 shadow-sm h-12" value={formData.assessment.prognosis} onChange={e => updateData('assessment', 'prognosis', e.target.value)}>
                          <option value="">請選擇...</option>
                          <option value="Excellent">極佳 (Excellent)</option>
                          <option value="Good">良好 (Good)</option>
                          <option value="Fair">普通 (Fair)</option>
                          <option value="Poor">不佳 (Poor)</option>
                        </select>
                        <textarea className="w-full md:w-2/3 border rounded-lg p-3 bg-gray-50 shadow-sm min-h-[100px]" placeholder="詳細描述潛力狀況..." value={formData.assessment.prognosisDesc} onChange={e => updateData('assessment', 'prognosisDesc', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 頁面 A-1：問題列表 */}
                {isExporting && <div className="html2pdf__page-break"></div>}
                {(activeSubTab === 1 || isExporting) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">問題列表 (Problem List)</label>
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                      {formData.assessment.problemList.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="w-6 text-right mt-3 text-gray-500 font-medium">{idx + 1}.</span>
                          <textarea 
                            className="flex-1 border rounded-lg p-3 bg-white text-sm min-h-[80px]" 
                            value={item} 
                            onChange={e => updateArrayData('assessment', 'problemList', idx, e.target.value)} 
                          />
                          <button onClick={() => removeArrayItem('assessment', 'problemList', idx)} className="text-gray-400 hover:text-red-500 mt-3 print:hidden"><X size={18}/></button>
                        </div>
                      ))}
                      <button onClick={() => addArrayItem('assessment', 'problemList')} className="text-blue-600 text-sm flex items-center gap-1 mt-2 ml-8 print:hidden">
                        <PlusCircle size={16}/> 新增項目
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================================= P: Plan ================================= */}
            {isExporting && <div className="html2pdf__page-break"></div>}
            <div className={`${(activeTab === 'P' || isExporting) ? 'block' : 'hidden print:block'} mb-8`}>
              <h2 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2 border-b pb-2">
                <CheckCircle size={20} /> 治療計畫 (Plan)
              </h2>

              {/* 次級導航列 (進度條) */}
              {!isExporting && (
                <div className="flex justify-center items-center gap-1 mb-6 print:hidden">
                  {subTabsConfig['P'].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSubTab(idx)}
                      className="p-3 focus:outline-none touch-manipulation"
                      aria-label={`切換至子頁面 ${idx + 1}`}
                    >
                      <div className={`h-3 rounded-full transition-all duration-300 shadow-sm ${activeSubTab === idx ? 'w-12 bg-blue-600' : 'w-4 bg-gray-300 hover:bg-gray-400'}`} />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-6">
                {/* 頁面 P-0：治療目標 */}
                {(activeSubTab === 0 || isExporting) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">短期目標 (Short-term Goals)</label>
                      <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[150px]" value={formData.plan.stg} onChange={e => updateData('plan', 'stg', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">長期目標 (Long-term Goals)</label>
                      <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[150px]" value={formData.plan.ltg} onChange={e => updateData('plan', 'ltg', e.target.value)} />
                    </div>
                  </div>
                )}
                
                {/* 頁面 P-1：治療方案與衛教 */}
                {isExporting && <div className="html2pdf__page-break"></div>}
                {(activeSubTab === 1 || isExporting) && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">治療方案 (Treatment Plan)</label>
                      <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                        {formData.plan.treatmentPlan.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="w-6 text-right mt-3 text-gray-500 font-medium">{idx + 1}.</span>
                            <textarea 
                              className="flex-1 border rounded-lg p-3 bg-white text-sm min-h-[80px]" 
                              value={item} 
                              onChange={e => updateArrayData('plan', 'treatmentPlan', idx, e.target.value)} 
                            />
                            <button onClick={() => removeArrayItem('plan', 'treatmentPlan', idx)} className="text-gray-400 hover:text-red-500 mt-3 print:hidden"><X size={18}/></button>
                          </div>
                        ))}
                        <button onClick={() => addArrayItem('plan', 'treatmentPlan')} className="text-blue-600 text-sm flex items-center gap-1 mt-2 ml-8 print:hidden">
                          <PlusCircle size={16}/> 新增方案
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">自我管理與居家運動 (Home Program)</label>
                      <textarea className="w-full border rounded-lg p-3 bg-gray-50 min-h-[150px]" value={formData.plan.homeProgram} onChange={e => updateData('plan', 'homeProgram', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center text-white">
          <div className="bg-white text-blue-600 px-6 py-4 rounded-lg shadow-xl font-bold flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {exportMessage}
          </div>
        </div>
      )}

      {/* --- Body Chart 彈出視窗 --- */}
      {isSymptomModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold">標記部位：{selectedRegion?.name}</h3>
              <button onClick={() => setIsSymptomModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* 表現性質 (單選) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">表現性質 (單選)</label>
                <div className="flex gap-2 flex-wrap">
                  {symptomTypesList.map(t => (
                    <label key={t} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${currentSymptom.type === t ? 'bg-red-500 text-white border-red-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                      <input 
                        type="radio" name="symptomType" className="hidden"
                        checked={currentSymptom.type === t}
                        onChange={() => setCurrentSymptom({...currentSymptom, type: t})}
                      /> {t}
                    </label>
                  ))}
                </div>
              </div>

              {/* 詳細位置描述 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">詳細位置描述</label>
                <textarea className="w-full border rounded-lg p-3 text-sm bg-gray-50 min-h-[80px]" value={currentSymptom.locationDesc} onChange={e => setCurrentSymptom({...currentSymptom, locationDesc: e.target.value})} />
              </div>

              {/* VAS Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold text-gray-700">VAS 量表</label>
                  <span className={`font-bold text-lg ${currentSymptom.vas > 7 ? 'text-red-600' : currentSymptom.vas > 3 ? 'text-orange-500' : 'text-green-600'}`}>{currentSymptom.vas}</span>
                </div>
                <input 
                  type="range" min="0" max="10" step="1" 
                  className="w-full accent-red-500"
                  value={currentSymptom.vas}
                  onChange={e => setCurrentSymptom({...currentSymptom, vas: parseInt(e.target.value)})}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 (無痛)</span>
                  <span>10 (極痛)</span>
                </div>
              </div>

              {/* 頻率與時間 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">發生頻率</label>
                  <select className="w-full border rounded p-2 text-sm bg-gray-50" value={currentSymptom.freq} onChange={e => setCurrentSymptom({...currentSymptom, freq: e.target.value})}>
                    <option value="間歇">間歇</option>
                    <option value="持續">持續</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">日夜模式</label>
                  <select className="w-full border rounded p-2 text-sm bg-gray-50" value={currentSymptom.dayNight} onChange={e => setCurrentSymptom({...currentSymptom, dayNight: e.target.value})}>
                    <option value="皆有">皆有</option>
                    <option value="日間">日間疼痛</option>
                    <option value="夜間">夜間疼痛</option>
                  </select>
                </div>
              </div>

              {/* 加劇與減緩因子 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">加劇因子</label>
                <textarea className="w-full border rounded-lg p-3 text-sm bg-gray-50 mb-3 min-h-[80px]" value={currentSymptom.aggr} onChange={e => setCurrentSymptom({...currentSymptom, aggr: e.target.value})} />
                
                <label className="block text-xs text-gray-500 mb-1">減緩因子</label>
                <textarea className="w-full border rounded-lg p-3 text-sm bg-gray-50 min-h-[80px]" value={currentSymptom.ease} onChange={e => setCurrentSymptom({...currentSymptom, ease: e.target.value})} />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsSymptomModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">取消</button>
              <button onClick={saveSymptom} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">儲存</button>
            </div>
          </div>
        </div>
      )}

      {/* --- 觀察與觸診 編輯彈出視窗 --- */}
      {isObsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold">編輯觀察與觸診項目</h3>
              <button onClick={() => setIsObsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm text-gray-500 mb-2">請勾選發現的項目，並在下方填寫詳細描述。</p>
              {Object.keys(formData.objective.observation).map(obsKey => {
                const obsData = formData.objective.observation[obsKey];
                return (
                  <div key={obsKey} className={`border rounded-lg p-3 transition-colors ${obsData.checked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input 
                        type="checkbox" 
                        checked={obsData.checked}
                        onChange={() => toggleObservation(obsKey)}
                        className="w-4 h-4 text-blue-600"
                      /> 
                      <span className="font-medium text-gray-700">{obsKey}</span>
                    </label>
                    {obsData.checked && (
                      <textarea 
                        className="w-full mt-2 border border-blue-100 rounded-lg p-3 text-sm bg-white focus:outline-blue-300 min-h-[100px]" 
                        placeholder="請描述詳細情況（位置、程度等）..."
                        value={obsData.text}
                        onChange={(e) => updateObservationText(obsKey, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsObsModalOpen(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">完成</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
