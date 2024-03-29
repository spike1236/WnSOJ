#include <bits/stdc++.h>
using namespace std;
const int MOD = 1e9 + 7, MAXN = 1e6 + 10;
int dp[MAXN];

int main() {
    dp[0] = 1;
    dp[1] = 1;
    for(int i = 2; i < MAXN; ++i) dp[i] = (dp[i - 1] + dp[i - 2]) % MOD;
    int T;
    cin >> T;
    while(T--) {
        int n;
        cin >> n;
        cout << dp[n] << endl;
    }
    return 0;
}
