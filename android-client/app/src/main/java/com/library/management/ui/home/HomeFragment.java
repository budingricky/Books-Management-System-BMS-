package com.library.management.ui.home;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.cardview.widget.CardView;
import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.model.ApiResponse;
import com.library.management.model.Statistics;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeFragment extends Fragment {
    
    private TextView tvTotalBooks;
    private TextView tvBorrowedBooks;
    private TextView tvAvailableBooks;
    private TextView tvBorrowRate;
    private CardView cardBooks;
    private CardView cardBorrows;
    private CardView cardCategories;
    private CardView cardStatistics;
    
    private ApiClient apiClient;
    
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        apiClient = ApiClient.getInstance(requireContext());
    }
    
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_home, container, false);
        
        initViews(root);
        setupClickListeners();
        loadStatistics();
        
        return root;
    }
    
    private void initViews(View root) {
        tvTotalBooks = root.findViewById(R.id.tv_total_books);
        tvBorrowedBooks = root.findViewById(R.id.tv_borrowed_books);
        tvAvailableBooks = root.findViewById(R.id.tv_available_books);
        tvBorrowRate = root.findViewById(R.id.tv_borrow_rate);
        
        cardBooks = root.findViewById(R.id.card_books);
        cardBorrows = root.findViewById(R.id.card_borrows);
        cardCategories = root.findViewById(R.id.card_categories);
        cardStatistics = root.findViewById(R.id.card_statistics);
    }
    
    private void setupClickListeners() {
        cardBooks.setOnClickListener(v -> navigateToBooks());
        cardBorrows.setOnClickListener(v -> navigateToBorrows());
        cardCategories.setOnClickListener(v -> navigateToCategories());
        cardStatistics.setOnClickListener(v -> navigateToStatistics());
    }
    
    private void loadStatistics() {
        apiClient.getApiService().getStatistics().enqueue(new Callback<ApiResponse<Statistics>>() {
            @Override
            public void onResponse(Call<ApiResponse<Statistics>> call, Response<ApiResponse<Statistics>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    Statistics stats = response.body().getData();
                    updateStatisticsUI(stats);
                } else {
                    showError("获取统计数据失败");
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Statistics>> call, Throwable t) {
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }
    
    private void updateStatisticsUI(Statistics stats) {
        if (getActivity() == null) return;
        
        getActivity().runOnUiThread(() -> {
            tvTotalBooks.setText(String.valueOf(stats.getTotalBooks()));
            tvBorrowedBooks.setText(String.valueOf(stats.getBorrowedBooks()));
            tvAvailableBooks.setText(String.valueOf(stats.getAvailableBooks()));
            tvBorrowRate.setText(String.format("%.1f%%", stats.getBorrowRate()));
        });
    }
    
    private void showError(String message) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> 
                Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show()
            );
        }
    }
    
    private void navigateToBooks() {
        // 导航到图书管理页面
        if (getActivity() != null) {
            androidx.navigation.Navigation.findNavController(getActivity(), R.id.nav_host_fragment_content_main)
                    .navigate(R.id.nav_books);
        }
    }
    
    private void navigateToBorrows() {
        // 导航到借阅管理页面
        if (getActivity() != null) {
            androidx.navigation.Navigation.findNavController(getActivity(), R.id.nav_host_fragment_content_main)
                    .navigate(R.id.nav_borrows);
        }
    }
    
    private void navigateToCategories() {
        // 导航到分类管理页面
        if (getActivity() != null) {
            androidx.navigation.Navigation.findNavController(getActivity(), R.id.nav_host_fragment_content_main)
                    .navigate(R.id.nav_categories);
        }
    }
    
    private void navigateToStatistics() {
        // 导航到统计页面
        if (getActivity() != null) {
            androidx.navigation.Navigation.findNavController(getActivity(), R.id.nav_host_fragment_content_main)
                    .navigate(R.id.nav_statistics);
        }
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // 页面恢复时刷新统计数据
        loadStatistics();
    }
}