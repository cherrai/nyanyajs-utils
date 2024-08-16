package test

import (
	"fmt"
	"runtime"
	"strconv"
	"sync"
	"time"

	"github.com/cherrai/dhkea-go"
	"github.com/cherrai/nyanyago-utils/nlog"
)

// to https://github.com/cherrai/dhkea-go

type RunCount struct {
	count        int
	successCount int
	totalCount   int
	elapsed      time.Duration
}

var (
	log = nlog.New()

	runCounts = []RunCount{
		{
			count:        10,
			successCount: 0,
			totalCount:   0,
		},
		{
			count:        50,
			successCount: 0,
			totalCount:   0,
		},
		{
			count:        100,
			successCount: 0,
			totalCount:   0,
		},
		{
			count:        200,
			successCount: 0,
			totalCount:   0,
		},
		{
			count:        500,
			successCount: 0,
			totalCount:   0,
		},
		{
			count:        1000,
			successCount: 0,
			totalCount:   0,
		},
		{
			count:        2000,
			successCount: 0,
			totalCount:   0,
		},
	}

	digitsArr = []int{768, 1024, 1536, 2048, 3072, 4096, 6144, 8192}
)

func fibonacci(num int) int {
	if num < 2 {
		return 1
	}
	return fibonacci(num-1) + fibonacci(num-2)
}
func Fib() {
	lt := log.Time()
	count := 10
	for i := 0; i < count; i++ {
		fibonacci(i)
	}
	lt.TimeEnd("FibTest")

	// lt = log.Time()
	// ch := make(chan struct{}, runtime.NumCPU())
	// var wg sync.WaitGroup
	// for i := 0; i < count; i++ {
	// 	ch <- struct{}{}
	// 	wg.Add(1)
	// 	go func() {
	// 		fibonacci(i)
	// 		defer wg.Done()
	// 		<-ch
	// 	}()
	// 	// log.Info(nums)
	// }
	// wg.Wait()
	// lt.TimeEnd("goroutine FibTest")

}

func TestSDH() {
	lt := log.Time()
	A := dhkea.DHKeaNew(1024)
	B := dhkea.DHKeaNew(1024)
	AKey := A.GetSharedKey(B.PublicKey)
	// fmt.Println("A key", AKey)

	BKey := B.GetSharedKey(A.PublicKey)
	// fmt.Println("A.PublicKey", A.PublicKey)
	// fmt.Println("A.PriviteKey", A.PrivateKey)
	// fmt.Println("A key", AKey)
	// fmt.Println("B.PublicKey", B.PublicKey)
	// fmt.Println("B.PriviteKey", B.PrivateKey)
	// fmt.Println("B key", BKey)

	// fmt.Println("==============================")
	log.Info("完成", AKey.String() == BKey.String())
	lt.TimeEnd("开始DH")

}

// 也可以用作性能测试
func Test() {
	nlog.SetPrefixTemplate("[{{Timer}}] [{{Count}}]@{{Name}}")
	nlog.SetTimeDigits(3)
	dhkea.EnableDHKeaCache = true

	// runCount := 200

	// for k, v := range os.Args {
	// 	if v == "--count" {
	// 		if os.Args[k+1] != "" {
	// 			runCount = nint.ToInt(os.Args[k+1])
	// 		}
	// 	}
	// }

	var wg sync.WaitGroup
	currentTime := time.Now()

	// // Input B PublicKey
	// var InputPublicKey string
	// fmt.Print("B PublicKey：")
	// fmt.Scanln(&InputPublicKey)
	// BPublicKeyBigint := big.NewInt(0)
	// BPublicKeyBigint.SetString(InputPublicKey, 10)
	// AKey := A.GetSharedKey(BPublicKeyBigint)

	log.Info("==================Start==================")

	for i := 0; i < len(runCounts); i++ {
		wg.Add(1)
		runFunc(i, func(index int) {
			defer wg.Done()
		})
	}

	wg.Wait()

	log.Info("CPU核心数 => ", runtime.NumCPU())
	for k, v := range runCounts {
		log.Info("==================执行第" + strconv.Itoa(k) + "轮 => " + strconv.Itoa(v.count) + "次==================")

		log.Info("成功次数 => ", v.successCount)
		log.Info("总次数 => ", v.totalCount)
		log.Info("本次耗时 => ", v.elapsed.String())
	}
	elapsed := time.Since(currentTime)
	log.Info("总耗时 => ", elapsed.String())
	log.Info("==================End==================")

	// elapsed := time.Since(currentTime)

	fmt.Println("bye")

	// ch1 := make(chan int, 1)
	// <-ch1
	// var wg1 sync.WaitGroup
	// wg1.Add(1)
	// wg1.Wait()

	// var m sync.Mutex
	// m.Lock()
	// m.Lock()
	// go func() {
	// 	// time.After(time.Second * 60)
	// 	select {}
	// }()

	// time.After(time.Second * 60)
	// <-make(chan struct{})

	// ctx, cancel := context.WithCancel(context.Background())
	// defer cancel()
	// go func() {
	// 	fmt.Println("Go routine running")
	// 	time.Sleep(3 * time.Second)
	// 	fmt.Println("Go routine done")
	// 	cancel()
	// }()
	// <-ctx.Done()
	// fmt.Println("bye")
}

func runFunc(index int, sfunc func(index int)) {

	ch := make(chan struct{}, runtime.NumCPU())

	var wg sync.WaitGroup
	currentTime := time.Now()
	totalCount := 0
	successCount := 0

	rc := &runCounts[index]
	log.Info("执行第" + strconv.Itoa(rc.count) + "轮")
	for i := 0; i < rc.count; i++ {
		ch <- struct{}{}
		wg.Add(1)
		go func(count int, digits int) {
			totalCount++
			currentTime := time.Now()
			A := dhkea.DHKeaNew(digits)
			B := dhkea.DHKeaNew(digits)
			AKey := A.GetSharedKey(B.PublicKey)
			// fmt.Println("A key", AKey)

			BKey := B.GetSharedKey(A.PublicKey)
			// fmt.Println("A.PublicKey", A.PublicKey)
			// fmt.Println("A.PriviteKey", A.PrivateKey)
			// fmt.Println("A key", AKey)
			// fmt.Println("B.PublicKey", B.PublicKey)
			// fmt.Println("B.PriviteKey", B.PrivateKey)
			// fmt.Println("B key", BKey)

			// fmt.Println("==============================")
			if AKey.String() == BKey.String() {
				successCount++
			}
			elapsed := time.Since(currentTime)
			log.Info(strconv.Itoa(rc.count)+"轮次	第"+strconv.Itoa(count)+"次计算 => 位数：", strconv.Itoa(digits), "key值对比：", AKey.String() == BKey.String(), "耗时：", elapsed.String())
			defer wg.Done()
			<-ch
		}(i+1, digitsArr[i%8])
	}
	wg.Wait()
	sfunc(index)
	elapsed := time.Since(currentTime)
	rc.successCount = successCount
	rc.totalCount = totalCount
	rc.elapsed = elapsed
}
