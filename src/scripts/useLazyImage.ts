import { useEffect, useRef } from "react"

/**
 * Lazy Loading Hook
 * IntersectionObserver를 사용하여 이미지가 화면에 보일 때만 로드
 */
export function useLazyImage() {
    const imgRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        const imgElement = imgRef.current
        if (!imgElement) return

        // IntersectionObserver 생성
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement
                        const dataSrc = img.getAttribute("data-src")
                        
                        if (dataSrc) {
                            // 실제 이미지 로드
                            img.src = dataSrc
                            img.removeAttribute("data-src")
                            
                            // 로드 완료 시 클래스 추가 (CSS 애니메이션용)
                            img.onload = () => {
                                img.classList.add("loaded")
                            }
                            
                            // 에러 처리
                            img.onerror = () => {
                                img.classList.add("error")
                                // 에러 시 placeholder 유지 (src는 그대로)
                            }
                        }
                        
                        // 관찰 중단
                        observer.unobserve(img)
                    }
                })
            },
            {
                // 옵션: 50px 전에 미리 로드 시작
                rootMargin: "50px",
            }
        )

        // 이미지 관찰 시작
        observer.observe(imgElement)

        // Cleanup
        return () => {
            if (imgElement) {
                observer.unobserve(imgElement)
            }
        }
    }, [])

    return imgRef
}

/**
 * Placeholder 이미지 (SVG Data URL)
 * 회색 박스로 로딩 중 표시
 */
export const PLACEHOLDER_IMAGE = 
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E" +
    "%3Crect width='400' height='300' fill='%23f0f0f0'/%3E" +
    "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' " +
    "font-family='sans-serif' font-size='18' fill='%23999'%3ELoading...%3C/text%3E%3C/svg%3E"

/**
 * 에러 시 표시할 이미지
 */
export const ERROR_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E" +
    "%3Crect width='400' height='300' fill='%23f5f5f5'/%3E" +
    "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' " +
    "font-family='sans-serif' font-size='18' fill='%23ccc'%3EImage not available%3C/text%3E%3C/svg%3E"
