"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import styles from "./page.module.css";

/* Sort dropdown — đặt cùng hàng priceFilters */
export function SortSelectClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "default";

    const updateSort = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "default") {
            params.set("sort", value);
        } else {
            params.delete("sort");
        }
        router.push(`/deal?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    return (
        <select
            value={currentSort === "default" ? "" : currentSort}
            onChange={(e) => updateSort(e.target.value)}
            className={styles.sortSelect}
        >
            <option value="" hidden>Sắp xếp</option>
            <option value="default">Mặc định</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="discount_desc">% Giảm nhiều nhất</option>
        </select>
    );
}

/* Search bar — đặt riêng hàng full width */
export function SearchDealClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentQ = searchParams.get("q") || "";
    const [searchValue, setSearchValue] = useState(currentQ);

    useEffect(() => {
        setSearchValue(currentQ);
    }, [currentQ]);

    const updateSearch = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("q", value);
        } else {
            params.delete("q");
        }
        router.push(`/deal?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateSearch(searchValue);
    };

    return (
        <form onSubmit={handleSearch} className={styles.searchForm}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Tìm kiếm deal..."
                className={styles.searchInput}
            />
            {searchValue && (
                <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => { setSearchValue(""); updateSearch(""); }}
                    aria-label="Xóa tìm kiếm"
                >×</button>
            )}
        </form>
    );
}
