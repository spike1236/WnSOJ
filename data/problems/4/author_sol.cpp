#include <bits/stdc++.h>
using namespace std;
const int MAXN = 1e5 + 10;
int deg[MAXN];

int main() {
    int n, m;
    cin >> n >> m;
    for(int i = 1; i <= m; ++i) {
        int u, v;
        cin >> u >> v;
        deg[u]++;
        deg[v]++;
    }
    int u = 0;
    for(int i = 1; i <= n; ++i)
        if(deg[i] > deg[u]) u = i;
    cout << u << endl;
    return 0;
}
