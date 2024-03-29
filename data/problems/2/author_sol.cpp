#include <bits/stdc++.h>
using namespace std;
#define ll long long

const int MAXN = 1e5 + 10;
int n;
ll t[MAXN << 2];

void upd(int pos, int val, int v = 1, int tl = 1, int tr = n) {
    if(tl == tr) {
        t[v] = val;
        return;
    }
    int tm = tl + tr >> 1;
    if(pos <= tm) upd(pos, val, v << 1, tl, tm);
    else upd(pos, val, v << 1 | 1, tm + 1, tr);
    t[v] = t[v << 1] + t[v << 1 | 1];
}

ll get(int l, int r, int v = 1, int tl = 1, int tr = n) {
    if(l <= tl && tr <= r) return t[v];
    if(l > tr || r < tl) return 0;
    int tm = tl + tr >> 1;
    return get(l, r, v << 1, tl, tm) + get(l, r, v << 1 | 1, tm + 1, tr);
}

int main() {
    cin >> n;
    for(int i = 1; i <= n; ++i) {
        ll x;
        cin >> x;
        upd(i, x);
    }
    int q;
    cin >> q;
    for(int i = 1; i <= q; ++i) {
        int type, l, r;
        cin >> type >> l >> r;
        if(type == 1) upd(l, r);
        else cout << get(l, r) << '\n';
    }
    return 0;
}
