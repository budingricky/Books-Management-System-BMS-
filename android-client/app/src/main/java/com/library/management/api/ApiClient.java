package com.library.management.api;

import android.content.Context;
import android.content.SharedPreferences;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static final String PREF_NAME = "library_settings";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER_URL = "http://10.0.2.2:3001/"; // Android模拟器访问本机
    
    private static ApiClient instance;
    private ApiService apiService;
    private Retrofit retrofit;
    private Context context;
    private String baseUrl;
    
    private ApiClient(Context context) {
        this.context = context.getApplicationContext();
        this.baseUrl = getServerUrl();
        initRetrofit();
    }
    
    public static synchronized ApiClient getInstance(Context context) {
        if (instance == null) {
            instance = new ApiClient(context);
        }
        return instance;
    }
    
    private void initRetrofit() {
        // 创建Gson实例
        Gson gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                .setLenient()
                .create();
        
        // 创建HTTP日志拦截器
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        
        // 创建OkHttp客户端
        OkHttpClient okHttpClient = new OkHttpClient.Builder()
                .addInterceptor(loggingInterceptor)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
        
        // 创建Retrofit实例
        retrofit = new Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();
        
        // 创建API服务
        apiService = retrofit.create(ApiService.class);
    }
    
    public ApiService getApiService() {
        return apiService;
    }
    
    public String getBaseUrl() {
        return baseUrl;
    }
    
    public void updateServerUrl(String newUrl) {
        if (newUrl != null && !newUrl.equals(baseUrl)) {
            // 确保URL以/结尾
            if (!newUrl.endsWith("/")) {
                newUrl += "/";
            }
            
            this.baseUrl = newUrl;
            saveServerUrl(newUrl);
            initRetrofit(); // 重新初始化Retrofit
        }
    }
    
    private String getServerUrl() {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
    }
    
    private void saveServerUrl(String url) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_SERVER_URL, url).apply();
    }
    
    // 测试服务器连接
    public void testConnection(ConnectionCallback callback) {
        apiService.getStatistics().enqueue(new retrofit2.Callback<com.library.management.model.ApiResponse<com.library.management.model.Statistics>>() {
            @Override
            public void onResponse(retrofit2.Call<com.library.management.model.ApiResponse<com.library.management.model.Statistics>> call, 
                                 retrofit2.Response<com.library.management.model.ApiResponse<com.library.management.model.Statistics>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess();
                } else {
                    callback.onError("服务器响应错误: " + response.code());
                }
            }
            
            @Override
            public void onFailure(retrofit2.Call<com.library.management.model.ApiResponse<com.library.management.model.Statistics>> call, Throwable t) {
                callback.onError("连接失败: " + t.getMessage());
            }
        });
    }
    
    // 连接测试回调接口
    public interface ConnectionCallback {
        void onSuccess();
        void onError(String error);
    }
    
    // 获取默认服务器URL（用于设置页面显示）
    public static String getDefaultServerUrl() {
        return DEFAULT_SERVER_URL;
    }
}