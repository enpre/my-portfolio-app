"use client";
import React from "react";

function MainComponent() {
  const [customers, setCustomers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [showActivities, setShowActivities] = React.useState(false);
  const [activities, setActivities] = React.useState([]);
  const [newActivity, setNewActivity] = React.useState({
    activity_type: "電話",
    description: "",
    created_by: "",
  });

  // CSVインポート関連の状態
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [csvFile, setCsvFile] = React.useState(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importResults, setImportResults] = React.useState(null);

  // 顧客編集関連の状態
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState(null);

  // ソート関連の状態
  const [sortField, setSortField] = React.useState("created_at");
  const [sortDirection, setSortDirection] = React.useState("desc");

  // 新規顧客フォームの状態
  const [newCustomer, setNewCustomer] = React.useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    status: "リード",
    priority: "中",
    next_action: "",
    next_contact_date: "",
    notes: "",
    estimated_value: "",
    probability: 0,
  });

  // 日付フィルターの状態
  const [dateFilter, setDateFilter] = React.useState({
    startDate: "",
    endDate: "",
    dateType: "",
  });

  // ソート処理
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ソートされた顧客データを取得
  const sortedCustomers = React.useMemo(() => {
    const sorted = [...customers].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // 日付フィールドの処理
      if (sortField === "next_contact_date" || sortField === "created_at") {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }

      // 数値フィールドの処理
      if (sortField === "estimated_value" || sortField === "probability") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      // 文字列フィールドの処理
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [customers, sortField, sortDirection]);

  // 見込み金額の合計を計算
  const totalEstimatedValue = React.useMemo(() => {
    return customers.reduce((total, customer) => {
      const value = parseFloat(customer.estimated_value) || 0;
      return total + value;
    }, 0);
  }, [customers]);

  // ソートアイコンを取得
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <i className="fas fa-sort text-gray-400 ml-1"></i>;
    }
    return sortDirection === "asc" ? (
      <i className="fas fa-sort-up text-blue-600 ml-1"></i>
    ) : (
      <i className="fas fa-sort-down text-blue-600 ml-1"></i>
    );
  };

  // 顧客データを取得（日付フィルターを含む）
  const fetchCustomers = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: searchTerm,
          status: statusFilter,
          priority: priorityFilter,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          dateType: dateFilter.dateType,
        }),
      });

      if (!response.ok) {
        throw new Error(`顧客データの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
      setError("顧客データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, dateFilter]);

  // 活動履歴を取得
  const fetchActivities = React.useCallback(async (customerId) => {
    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId }),
      });

      if (!response.ok) {
        throw new Error(`活動履歴の取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setActivities(data.activities || []);
    } catch (err) {
      console.error(err);
      setError("活動履歴の取得に失敗しました");
    }
  }, []);

  // 初回データ取得
  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // 新規顧客作成
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) {
        throw new Error(`顧客作成に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setNewCustomer({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        status: "リード",
        priority: "中",
        next_action: "",
        next_contact_date: "",
        notes: "",
        estimated_value: "",
        probability: 0,
      });
      setShowAddForm(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setError("顧客の作成に失敗しました");
    }
  };

  // 顧客編集フォームを開く
  const handleEditCustomer = (customer) => {
    setEditingCustomer({
      ...customer,
      next_contact_date: customer.next_contact_date
        ? new Date(customer.next_contact_date).toISOString().split("T")[0]
        : "",
      estimated_value: customer.estimated_value || "",
      probability: customer.probability || 0,
    });
    setShowEditForm(true);
  };

  // 顧客情報更新
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const response = await fetch("/api/customers/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: editingCustomer.id,
          company_name: editingCustomer.company_name,
          contact_person: editingCustomer.contact_person,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          address: editingCustomer.address,
          status: editingCustomer.status,
          priority: editingCustomer.priority,
          next_action: editingCustomer.next_action,
          next_contact_date: editingCustomer.next_contact_date || null,
          notes: editingCustomer.notes,
          estimated_value: editingCustomer.estimated_value
            ? parseFloat(editingCustomer.estimated_value)
            : null,
          probability: parseInt(editingCustomer.probability) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`顧客更新に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setShowEditForm(false);
      setEditingCustomer(null);
      fetchCustomers();

      // 活動履歴に更新記録を追加
      await fetch("/api/activities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: editingCustomer.id,
          activity_type: "更新",
          description: "顧客情報が更新されました",
          created_by: "システム",
        }),
      });
    } catch (err) {
      console.error(err);
      setError("顧客情報の更新に失敗しました");
    }
  };

  // 活動記録追加
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const response = await fetch("/api/activities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          ...newActivity,
        }),
      });

      if (!response.ok) {
        throw new Error(`活動記録に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setNewActivity({
        activity_type: "電話",
        description: "",
        created_by: "",
      });
      fetchActivities(selectedCustomer.id);
    } catch (err) {
      console.error(err);
      setError("活動記録の追加に失敗しました");
    }
  };

  // ステータス色を取得
  const getStatusColor = (status) => {
    switch (status) {
      case "リード":
        return "bg-gray-100 text-gray-800";
      case "アプローチ":
        return "bg-blue-100 text-blue-800";
      case "商談中":
        return "bg-yellow-100 text-yellow-800";
      case "成約":
        return "bg-green-100 text-green-800";
      case "失注":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 優先度色を取得
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "高":
        return "bg-red-100 text-red-800";
      case "中":
        return "bg-yellow-100 text-yellow-800";
      case "低":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // CSVファイルを読み込む
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setImportResults(null);
    } else {
      setError("CSVファイルを選択してください");
    }
  };

  // CSVインポート処理
  const handleImportCSV = async () => {
    if (!csvFile) {
      setError("CSVファイルを選択してください");
      return;
    }

    try {
      setImportLoading(true);

      const csvText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(csvFile, "UTF-8");
      });

      const response = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvData: csvText,
          skipDuplicates: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`インポートに失敗しました: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setImportResults(data.results);
      fetchCustomers(); // データを再取得
    } catch (err) {
      console.error(err);
      setError("CSVインポートに失敗しました: " + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // CSVテンプレートをダウンロード
  const downloadTemplate = () => {
    const template = `company_name,contact_person,email,phone,address,status,priority,next_action,next_contact_date,notes,estimated_value,probability
株式会社サンプル,田中太郎,tanaka@sample.co.jp,03-1234-5678,東京都渋谷区,リード,中,初回訪問,2025-01-25,問い合わせあり,500000,30
テスト商事,佐藤花子,sato@test.co.jp,03-8765-4321,東京都新宿区,アプローチ,高,提案書作成,2025-01-20,新システム導入に興味あり,300000,60`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "顧客データテンプレート.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                顧客管理システム
              </h1>
              <p className="text-gray-600 mt-1">営業進捗を効率的に管理</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <i className="fas fa-upload mr-2"></i>
                CSVインポート
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                新規顧客追加
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="fas fa-users text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総顧客数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600">
                  <i className="fas fa-arrow-up text-xs mr-1"></i>
                  <span className="text-sm font-medium">+12%</span>
                </div>
                <p className="text-xs text-gray-500">前月比</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <i className="fas fa-handshake text-yellow-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総商談数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      customers.filter(
                        (c) =>
                          c.status === "商談中" || c.status === "アプローチ"
                      ).length
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600">
                  <i className="fas fa-arrow-up text-xs mr-1"></i>
                  <span className="text-sm font-medium">+8%</span>
                </div>
                <p className="text-xs text-gray-500">前月比</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="fas fa-trophy text-green-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総契約数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter((c) => c.status === "成約").length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600">
                  <i className="fas fa-arrow-up text-xs mr-1"></i>
                  <span className="text-sm font-medium">+15%</span>
                </div>
                <p className="text-xs text-gray-500">前月比</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <i className="fas fa-percentage text-purple-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">成約率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.length > 0
                      ? Math.round(
                          (customers.filter((c) => c.status === "成約").length /
                            customers.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-red-600">
                  <i className="fas fa-arrow-down text-xs mr-1"></i>
                  <span className="text-sm font-medium">-2%</span>
                </div>
                <p className="text-xs text-gray-500">前月比</p>
              </div>
            </div>
          </div>
        </div>

        {/* パフォーマンス概要 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <i className="fas fa-chart-line text-blue-600 mr-2"></i>
              営業パフォーマンス概要
            </h3>
            <span className="text-sm text-gray-500">リアルタイム更新</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 商談進行率 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
                <svg
                  className="w-20 h-20 transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${
                      customers.length > 0
                        ? (customers.filter(
                            (c) =>
                              c.status === "商談中" || c.status === "アプローチ"
                          ).length /
                            customers.length) *
                          100
                        : 0
                    }, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {customers.length > 0
                    ? Math.round(
                        (customers.filter(
                          (c) =>
                            c.status === "商談中" || c.status === "アプローチ"
                        ).length /
                          customers.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                商談進行率
              </h4>
              <p className="text-xs text-gray-500">アクティブな商談の割合</p>
            </div>

            {/* 成約率 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
                <svg
                  className="w-20 h-20 transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-green-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${
                      customers.length > 0
                        ? (customers.filter((c) => c.status === "成約").length /
                            customers.length) *
                          100
                        : 0
                    }, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {customers.length > 0
                    ? Math.round(
                        (customers.filter((c) => c.status === "成約").length /
                          customers.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">成約率</h4>
              <p className="text-xs text-gray-500">全顧客に対する成約の割合</p>
            </div>

            {/* 高優先度対応率 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
                <svg
                  className="w-20 h-20 transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-red-600"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${
                      customers.length > 0
                        ? (customers.filter((c) => c.priority === "高").length /
                            customers.length) *
                          100
                        : 0
                    }, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {customers.length > 0
                    ? Math.round(
                        (customers.filter((c) => c.priority === "高").length /
                          customers.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                高優先度率
              </h4>
              <p className="text-xs text-gray-500">重要顧客の割合</p>
            </div>
          </div>

          {/* パフォーマンス指標 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">
                    好調
                  </span>
                </div>
                <p className="text-xs text-gray-500">成約率 20% 以上</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">
                    普通
                  </span>
                </div>
                <p className="text-xs text-gray-500">成約率 10-20%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">
                    要改善
                  </span>
                </div>
                <p className="text-xs text-gray-500">成約率 10% 未満</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-target text-blue-600 mr-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    目標
                  </span>
                </div>
                <p className="text-xs text-gray-500">成約率 25%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="会社名、担当者名、メールで検索"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全て</option>
                <option value="リード">リード</option>
                <option value="アプローチ">アプローチ</option>
                <option value="商談中">商談中</option>
                <option value="成約">成約</option>
                <option value="失注">失注</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全て</option>
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchCustomers}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-search mr-2"></i>
                検索
              </button>
            </div>
          </div>
        </div>

        {/* 顧客一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("company_name")}
                    >
                      <div className="flex items-center">
                        会社情報
                        {getSortIcon("company_name")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        ステータス
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("priority")}
                    >
                      <div className="flex items-center">
                        優先度
                        {getSortIcon("priority")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("next_contact_date")}
                    >
                      <div className="flex items-center">
                        次回連絡日
                        {getSortIcon("next_contact_date")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      次回アクション
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("estimated_value")}
                    >
                      <div className="flex items-center">
                        見込み金額
                        {getSortIcon("estimated_value")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("probability")}
                    >
                      <div className="flex items-center">
                        確度
                        {getSortIcon("probability")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.company_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.contact_person}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            customer.status
                          )}`}
                        >
                          {customer.status || "リード"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                            customer.priority
                          )}`}
                        >
                          {customer.priority || "中"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.next_contact_date ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(
                                customer.next_contact_date
                              ).toLocaleDateString("ja-JP")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const today = new Date();
                                const contactDate = new Date(
                                  customer.next_contact_date
                                );
                                const diffTime = contactDate - today;
                                const diffDays = Math.ceil(
                                  diffTime / (1000 * 60 * 60 * 24)
                                );

                                if (diffDays < 0) {
                                  return (
                                    <span className="text-red-600">
                                      期限切れ
                                    </span>
                                  );
                                } else if (diffDays === 0) {
                                  return (
                                    <span className="text-orange-600">
                                      今日
                                    </span>
                                  );
                                } else if (diffDays <= 3) {
                                  return (
                                    <span className="text-yellow-600">
                                      {diffDays}日後
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="text-gray-500">
                                      {diffDays}日後
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.next_action || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.estimated_value
                          ? `¥${Number(
                              customer.estimated_value
                            ).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900 mr-2">
                            {customer.probability || 0}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${customer.probability || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowActivities(true);
                            fetchActivities(customer.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <i className="fas fa-history mr-1"></i>
                          履歴
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          編集
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customers.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600">顧客データがありません</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新規顧客追加モーダル */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <i className="fas fa-user-plus text-blue-600 mr-3"></i>
                    新規顧客追加
                  </h2>
                  <p className="text-gray-600 mt-1">
                    新しい顧客情報を登録して営業活動を開始しましょう
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-6">
                {/* 基本情報セクション */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <i className="fas fa-building text-blue-600 text-xl mr-3"></i>
                    <h3 className="text-lg font-bold text-blue-900">
                      基本情報
                    </h3>
                    <span className="ml-2 text-sm text-blue-700">
                      *は必須項目
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-building mr-1 text-blue-600"></i>
                        会社名 *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomer.company_name}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            company_name: e.target.value,
                          })
                        }
                        placeholder="例: 株式会社サンプル"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-user mr-1 text-blue-600"></i>
                        担当者名 *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomer.contact_person}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            contact_person: e.target.value,
                          })
                        }
                        placeholder="例: 田中太郎"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-envelope mr-1 text-blue-600"></i>
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            email: e.target.value,
                          })
                        }
                        placeholder="例: tanaka@sample.co.jp"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-phone mr-1 text-blue-600"></i>
                        電話番号
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            phone: e.target.value,
                          })
                        }
                        placeholder="例: 03-1234-5678"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <i className="fas fa-map-marker-alt mr-1 text-blue-600"></i>
                      住所
                    </label>
                    <textarea
                      value={newCustomer.address}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: e.target.value,
                        })
                      }
                      placeholder="例: 東京都渋谷区渋谷1-1-1"
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* 営業情報セクション */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <i className="fas fa-chart-line text-green-600 text-xl mr-3"></i>
                    <h3 className="text-lg font-bold text-green-900">
                      営業情報
                    </h3>
                    <span className="ml-2 text-sm text-green-700">
                      営業活動に関する設定
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-flag mr-1 text-green-600"></i>
                        ステータス
                      </label>
                      <select
                        value={newCustomer.status}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      >
                        <option value="リード">🔍 リード</option>
                        <option value="アプローチ">📞 アプローチ</option>
                        <option value="商談中">🤝 商談中</option>
                        <option value="成約">✅ 成約</option>
                        <option value="失注">❌ 失注</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-exclamation-triangle mr-1 text-green-600"></i>
                        優先度
                      </label>
                      <select
                        value={newCustomer.priority}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            priority: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      >
                        <option value="高">🔴 高</option>
                        <option value="中">🟡 中</option>
                        <option value="低">🟢 低</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-percentage mr-1 text-green-600"></i>
                        確度 (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newCustomer.probability}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            probability: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="例: 30"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-yen-sign mr-1 text-green-600"></i>
                        見込み金額
                      </label>
                      <input
                        type="number"
                        value={newCustomer.estimated_value}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            estimated_value: e.target.value,
                          })
                        }
                        placeholder="例: 500000"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        円単位で入力してください
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-calendar-alt mr-1 text-green-600"></i>
                        次回連絡日
                      </label>
                      <input
                        type="date"
                        value={newCustomer.next_contact_date}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            next_contact_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* アクション・備考セクション */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <i className="fas fa-tasks text-yellow-600 text-xl mr-3"></i>
                    <h3 className="text-lg font-bold text-yellow-900">
                      アクション・備考
                    </h3>
                    <span className="ml-2 text-sm text-yellow-700">
                      今後の活動予定やメモ
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-clipboard-list mr-1 text-yellow-600"></i>
                        次回アクション
                      </label>
                      <input
                        type="text"
                        value={newCustomer.next_action}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            next_action: e.target.value,
                          })
                        }
                        placeholder="例: 初回訪問、提案書作成、見積もり提出"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <i className="fas fa-sticky-note mr-1 text-yellow-600"></i>
                        備考・メモ
                      </label>
                      <textarea
                        value={newCustomer.notes}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            notes: e.target.value,
                          })
                        }
                        placeholder="例: 新システム導入に興味あり。決裁者は社長。予算は年内に確保予定。"
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        顧客の特徴や重要な情報を記録してください
                      </p>
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    <i className="fas fa-times mr-2"></i>
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomer({
                        company_name: "",
                        contact_person: "",
                        email: "",
                        phone: "",
                        address: "",
                        status: "リード",
                        priority: "中",
                        next_action: "",
                        next_contact_date: "",
                        notes: "",
                        estimated_value: "",
                        probability: 0,
                      });
                    }}
                    className="px-6 py-3 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    <i className="fas fa-eraser mr-2"></i>
                    クリア
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg"
                  >
                    <i className="fas fa-save mr-2"></i>
                    顧客を登録する
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CSVインポートモーダル */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  CSVインポート
                </h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setImportResults(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* テンプレートダウンロード */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;