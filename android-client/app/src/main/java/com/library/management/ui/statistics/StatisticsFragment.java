package com.library.management.ui.statistics;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.api.ApiService;
import com.library.management.model.ApiResponse;
import com.library.management.model.Statistics;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StatisticsFragment extends Fragment {
    private SwipeRefreshLayout swipeRefreshLayout;
    private TextView tvTotalBooks;
    private TextView tvAvailableBooks;
    private TextView tvBorrowedBooks;
    private TextView tvTotalBorrows;
    private TextView tvActiveBorrows;
    private TextView tvOverdueBorrows;
    private TextView tvTotalCategories;
    private TextView tvBorrowRate;
    private TextView tvReturnRate;
    private TextView tvAverageBorrowDays;
    
    private ApiService apiService;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_statistics, container, false);
        
        initViews(view);
        setupSwipeRefresh();
        
        apiService = ApiClient.getApiService();
        
        loadStatistics();
        
        return view;
    }

    private void initViews(View view) {
        swipeRefreshLayout = view.findViewById(R.id.swipe_refresh);
        tvTotalBooks = view.findViewById(R.id.tv_total_books);
        tvAvailableBooks = view.findViewById(R.id.tv_available_books);
        tvBorrowedBooks = view.findViewById(R.id.tv_borrowed_books);
        tvTotalBorrows = view.findViewById(R.id.tv_total_borrows);
        tvActiveBorrows = view.findViewById(R.id.tv_active_borrows);
        tvOverdueBorrows = view.findViewById(R.id.tv_overdue_borrows);
        tvTotalCategories = view.findViewById(R.id.tv_total_categories);
        tvBorrowRate = view.findViewById(R.id.tv_borrow_rate);
        tvReturnRate = view.findViewById(R.id.tv_return_rate);
        tvAverageBorrowDays = view.findViewById(R.id.tv_average_borrow_days);
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setOnRefreshListener(this::loadStatistics);
    }

    private void loadStatistics() {
        swipeRefreshLayout.setRefreshing(true);
        
        apiService.getStatistics().enqueue(new Callback<ApiResponse<Statistics>>() {
            @Override
            public void onResponse(Call<ApiResponse<Statistics>> call, Response<ApiResponse<Statistics>> response) {
                swipeRefreshLayout.setRefreshing(false);
                
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Statistics> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        updateStatistics(apiResponse.getData());
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("加载统计数据失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Statistics>> call, Throwable t) {
                swipeRefreshLayout.setRefreshing(false);
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    private void updateStatistics(Statistics statistics) {
        // 图书统计
        tvTotalBooks.setText(String.valueOf(statistics.getTotalBooks()));
        tvAvailableBooks.setText(String.valueOf(statistics.getAvailableBooks()));
        tvBorrowedBooks.setText(String.valueOf(statistics.getBorrowedBooks()));
        
        // 借阅统计
        tvTotalBorrows.setText(String.valueOf(statistics.getTotalBorrows()));
        tvActiveBorrows.setText(String.valueOf(statistics.getActiveBorrows()));
        tvOverdueBorrows.setText(String.valueOf(statistics.getOverdueBorrows()));
        
        // 分类统计
        tvTotalCategories.setText(String.valueOf(statistics.getTotalCategories()));
        
        // 比率统计
        double borrowRate = statistics.getTotalBooks() > 0 ? 
            (double) statistics.getBorrowedBooks() / statistics.getTotalBooks() * 100 : 0;
        tvBorrowRate.setText(String.format("%.1f%%", borrowRate));
        
        double returnRate = statistics.getTotalBorrows() > 0 ? 
            (double) (statistics.getTotalBorrows() - statistics.getActiveBorrows()) / statistics.getTotalBorrows() * 100 : 0;
        tvReturnRate.setText(String.format("%.1f%%", returnRate));
        
        // 平均借阅天数（这里使用模拟数据，实际应该从API获取）
        tvAverageBorrowDays.setText("15.5");
    }

    private void showError(String message) {
        Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
    }
}