package com.library.management.ui.settings;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.google.android.material.textfield.TextInputEditText;
import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.api.ApiService;
import com.library.management.model.ApiResponse;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsFragment extends Fragment {
    
    private static final String PREFS_NAME = "LibrarySettings";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER_URL = "http://localhost:3000";
    
    private TextInputEditText etServerUrl;
    private Button btnTestConnection;
    private Button btnSave;
    private ProgressBar progressBar;
    
    private SharedPreferences sharedPreferences;
    
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sharedPreferences = requireActivity().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
    
    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_settings, container, false);
        
        initViews(root);
        setupClickListeners();
        loadSettings();
        
        return root;
    }
    
    private void initViews(View root) {
        etServerUrl = root.findViewById(R.id.et_server_url);
        btnTestConnection = root.findViewById(R.id.btn_test_connection);
        btnSave = root.findViewById(R.id.btn_save);
        progressBar = root.findViewById(R.id.progress_bar);
    }
    
    private void setupClickListeners() {
        btnTestConnection.setOnClickListener(v -> testConnection());
        btnSave.setOnClickListener(v -> saveSettings());
    }
    
    private void loadSettings() {
        String serverUrl = sharedPreferences.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
        etServerUrl.setText(serverUrl);
    }
    
    private void saveSettings() {
        String serverUrl = etServerUrl.getText().toString().trim();
        
        if (serverUrl.isEmpty()) {
            etServerUrl.setError("请输入服务器地址");
            return;
        }
        
        if (!isValidUrl(serverUrl)) {
            etServerUrl.setError("请输入有效的URL地址");
            return;
        }
        
        // 保存设置
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_SERVER_URL, serverUrl);
        editor.apply();
        
        // 更新ApiClient的服务器地址
        ApiClient.getInstance().updateServerUrl(serverUrl);
        
        Toast.makeText(getContext(), "设置已保存", Toast.LENGTH_SHORT).show();
    }
    
    private void testConnection() {
        String serverUrl = etServerUrl.getText().toString().trim();
        
        if (serverUrl.isEmpty()) {
            etServerUrl.setError("请输入服务器地址");
            return;
        }
        
        if (!isValidUrl(serverUrl)) {
            etServerUrl.setError("请输入有效的URL地址");
            return;
        }
        
        showLoading(true);
        
        // 临时更新服务器地址进行测试
        ApiClient testClient = new ApiClient();
        testClient.updateServerUrl(serverUrl);
        ApiService apiService = testClient.getApiService();
        
        // 测试连接 - 尝试获取统计信息
        Call<ApiResponse<Object>> call = apiService.getStatistics();
        call.enqueue(new Callback<ApiResponse<Object>>() {
            @Override
            public void onResponse(Call<ApiResponse<Object>> call, Response<ApiResponse<Object>> response) {
                showLoading(false);
                if (response.isSuccessful()) {
                    showConnectionResult(true, "连接成功");
                } else {
                    showConnectionResult(false, "连接失败: HTTP " + response.code());
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Object>> call, Throwable t) {
                showLoading(false);
                showConnectionResult(false, "连接失败: " + t.getMessage());
            }
        });
    }
    
    private boolean isValidUrl(String url) {
        return url.startsWith("http://") || url.startsWith("https://");
    }
    
    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        btnTestConnection.setEnabled(!show);
        btnSave.setEnabled(!show);
    }
    
    private void showConnectionResult(boolean success, String message) {
        if (success) {
            Toast.makeText(getContext(), getString(R.string.connection_success), Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(getContext(), getString(R.string.connection_failed) + ": " + message, Toast.LENGTH_LONG).show();
        }
    }
    
    // 静态方法用于获取保存的服务器URL
    public static String getSavedServerUrl(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
    }
    
    // 静态方法用于保存服务器URL
    public static void saveServerUrl(Context context, String url) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_SERVER_URL, url);
        editor.apply();
    }
}