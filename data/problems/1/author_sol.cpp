#include <bits/stdc++.h>
using namespace std;
#define pb push_back
#define mp make_pair

const int base = 1e9;
typedef vector<int> BigInt;

void Set(BigInt &a) {
    while (a.size() > 1 && a.back() == 0) a.pop_back();
}

void Print(BigInt a) {
    Set(a);
    printf("%d", (a.size() == 0) ? 0 : a.back());
    for(int i= (int)a.size() - 2; i >= 0; --i) printf("%09d", a[i]);
}

BigInt Integer(string s) {
    BigInt ans;
    if (s.size() == 0) {ans.pb(0); return ans;}
    while (s.size()%9 != 0) s = '0'+s;
    for (int i=0;i<s.size();i+=9) {
        int v = 0;
        for (int j=i;j<i+9;j++) v = v*10+(s[j]-'0');
        ans.insert(ans.begin(),v);
    }
    Set(ans);
    return ans;
}

BigInt operator * (BigInt a, BigInt b) {
    Set(a);
    Set(b);
    BigInt ans;
    ans.assign(a.size()+b.size(), 0);
    for(int i = 0; i < a.size(); ++i) {
        long long carry = 0;
        for (int j=0;j<b.size() || carry > 0;j++) {
            long long s = ans[i+j] + carry + (long long)a[i]*(j<b.size()?(long long)b[j]:0ll);
            ans[i+j] = s%base;
            carry = s/base;
        }
    }
    Set(ans);
    return ans;
}

int main() {
    string a, b;
    cin >> a >> b;
    Print(BigInt(Integer(a)) * BigInt(Integer(b)));
    return 0;
}
