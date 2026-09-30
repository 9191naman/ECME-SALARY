import { useEffect, useState } from 'react';
import {
  api,
  ApiError,
  money,
  type Employee,
  type EmployeeInput,
  type Group,
  type Insights,
  type Meta,
  type Page,
} from './api';

export default function App() {
  const [tab, setTab] = useState<'people' | 'insights'>('people');
  const [meta, setMeta] = useState<Meta>();
  useEffect(() => {
    api.meta().then(setMeta);
  }, []);
  return (
    <div className="shell">
      <header>
        <h1>ACME pay ledger</h1>
        <nav>
          <button aria-pressed={tab === 'people'} onClick={() => setTab('people')}>
            Employees
          </button>
          <button aria-pressed={tab === 'insights'} onClick={() => setTab('insights')}>
            How we pay
          </button>
        </nav>
      </header>
      <main>
        {meta && (tab === 'people' ? <People meta={meta} /> : <InsightsView meta={meta} />)}
      </main>
    </div>
  );
}

function People({ meta }: { meta: Meta }) {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [department, setDept] = useState('');
  const [sort, setSort] = useState('fullName');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page>();
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<Employee | 'new'>();
  const [tick, setTick] = useState(0);
  const [dq, setDq] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDq(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    let live = true;
    api
      .list({ q: dq, country, department, sort, dir, page, pageSize: 25 })
      .then((d) => {
        if (live) {
          setData(d);
          setError(undefined);
        }
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
        }
      });
    return () => {
      live = false;
    };
  }, [dq, country, department, sort, dir, page, tick]);

  const th = (key: string, label: string) => {
    const handleSort = () => {
      if (sort === key) {
        setDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      } else {
        setSort(key);
        setDir('asc');
      }
      setPage(1);
    };

    return (
      <th aria-sort={sort === key ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button className="link" onClick={handleSort}>
          {label}
          {sort === key ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
        </button>
      </th>
    );
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section>
      <div className="toolbar">
        <input
          placeholder="Search name, email or title"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search employees"
        />
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPage(1);
          }}
          aria-label="Country"
        >
          <option value="">All countries</option>
          {meta.countryCodes.map((c) => (
            <option key={c} value={c}>
              {meta.countries[c].name}
            </option>
          ))}
        </select>
        <select
          value={department}
          onChange={(e) => {
            setDept(e.target.value);
            setPage(1);
          }}
          aria-label="Department"
        >
          <option value="">All departments</option>
          {meta.departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <button className="primary" onClick={() => setEditing('new')}>
          Add employee
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}. Check the server is running, then reload.
        </p>
      )}
      <div className="scroll">
        <table>
          <thead>
            <tr>
              {th('fullName', 'Name')}
              {th('country', 'Country')}
              {th('department', 'Department')}
              <th>Title</th>
              {th('salary', 'Annual salary')}
              {th('hireDate', 'Hired')}
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id}>
                <td>
                  {e.fullName}
                  <small>{e.email}</small>
                </td>
                <td>{e.country}</td>
                <td>{e.department}</td>
                <td>{e.jobTitle}</td>
                <td className="num">{money(e.salary, meta.countries[e.country].currency)}</td>
                <td>{e.hireDate}</td>
                <td className="actions">
                  <button className="link" onClick={() => setEditing(e)}>
                    Edit
                  </button>
                  <button
                    className="link danger"
                    onClick={async () => {
                      if (confirm(`Delete ${e.fullName}?`)) {
                        await api.remove(e.id);
                        setTick((t) => t + 1);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No employees match these filters. Clear a filter or add someone.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span>{data ? `${data.total.toLocaleString()} employees` : 'Loading…'}</span>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
      {editing && (
        <EmployeeForm
          meta={meta}
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setTick((t) => t + 1);
          }}
        />
      )}
    </section>
  );
}

function EmployeeForm({
  meta,
  initial,
  onClose,
  onSaved,
}: {
  meta: Meta;
  initial?: Employee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<EmployeeInput>(
    initial ?? {
      fullName: '',
      email: '',
      country: 'IN',
      department: meta.departments[0] ?? 'Engineering',
      jobTitle: '',
      salary: 0,
      hireDate: new Date().toISOString().slice(0, 10),
    },
  );
  const [errs, setErrs] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState<string>();
  const set = <K extends keyof EmployeeInput>(k: K, v: EmployeeInput[K]) => setF({ ...f, [k]: v });
  const field = (k: keyof EmployeeInput, label: string, type = 'text') => (
    <label>
      {label}
      <input
        type={type}
        value={f[k]}
        onChange={(e) =>
          set(k, (type === 'number' ? Number(e.target.value) : e.target.value) as never)
        }
      />
      {errs[k] && <span className="error">{errs[k][0]}</span>}
    </label>
  );
  const save = async () => {
    try {
      if (initial) {
        await api.update(initial.id, f);
      } else {
        await api.create(f);
      }
      onSaved();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrs(e.details ?? {});
        setMsg(e.message);
      }
    }
  };
  return (
    <div
      className="backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? 'Edit employee' : 'Add employee'}
    >
      <div className="modal">
        <h2>{initial ? 'Edit employee' : 'Add employee'}</h2>
        {field('fullName', 'Full name')}
        {field('email', 'Work email', 'email')}
        <label>
          Country
          <select value={f.country} onChange={(e) => set('country', e.target.value)}>
            {meta.countryCodes.map((c) => (
              <option key={c} value={c}>
                {meta.countries[c].name}
              </option>
            ))}
          </select>
        </label>
        {field('department', 'Department')}
        {field('jobTitle', 'Job title')}
        {field('salary', `Annual salary (${meta.countries[f.country].currency})`, 'number')}
        {field('hireDate', 'Hire date', 'date')}
        {msg && (
          <p role="alert" className="error">
            {msg}
          </p>
        )}
        <div className="row">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={save}>
            Save employee
          </button>
        </div>
      </div>
    </div>
  );
}

function InsightsView({ meta }: { meta: Meta }) {
  const [country, setCountry] = useState('');
  const [d, setD] = useState<Insights | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.insights(country || undefined).then((data) => {
      if (!cancelled) {
        setD(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [country]);
  if (!d) return <p>Loading insights…</p>;
  const f = (n: number) => money(n, d.currency);
  return (
    <section>
      <div className="toolbar">
        <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Scope">
          <option value="">Whole organisation (USD, approximate)</option>
          {meta.countryCodes.map((c) => (
            <option key={c} value={c}>
              {meta.countries[c].name} ({meta.countries[c].currency})
            </option>
          ))}
        </select>
      </div>
      <div className="kpis">
        <div>
          <b>{d.overall.count.toLocaleString()}</b>employees
        </div>
        <div>
          <b>{f(d.payroll)}</b>annual payroll
        </div>
        <div>
          <b>{f(d.overall.median)}</b>median salary
        </div>
        <div>
          <b>{f(d.overall.avg)}</b>average salary
        </div>
        <div>
          <b>{f(d.overall.p90)}</b>90th percentile
        </div>
      </div>
      {!country && (
        <Table
          title="Pay by country (local currency)"
          rows={d.byCountry}
          money={(n, g) => money(n, g.currency!)}
          label={(g) => meta.countries[g.group]?.name ?? g.group}
        />
      )}
      <Table title="Pay by department" rows={d.byDepartment} money={(n) => f(n)} />
      <Table
        title="Pay by job title (top 15 by headcount)"
        rows={d.byJobTitle}
        money={(n) => f(n)}
      />
    </section>
  );
}

function Table({
  title,
  rows,
  money: m,
  label,
}: {
  title: string;
  rows: Group[];
  money: (n: number, g: Group) => string;
  label?: (g: Group) => string;
}) {
  const max = Math.max(...rows.map((r) => r.max), 1);
  return (
    <div className="block">
      <h2>{title}</h2>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Headcount</th>
              <th>Min</th>
              <th>Median</th>
              <th>Average</th>
              <th>Max</th>
              <th>Range</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.group}>
                <td>{label ? label(g) : g.group}</td>
                <td className="num">{g.count.toLocaleString()}</td>
                <td className="num">{m(g.min, g)}</td>
                <td className="num">{m(g.median, g)}</td>
                <td className="num">{m(g.avg, g)}</td>
                <td className="num">{m(g.max, g)}</td>
                <td>
                  <div className="range" aria-hidden>
                    <i
                      style={{
                        left: `${(g.min / max) * 100}%`,
                        width: `${((g.max - g.min) / max) * 100}%`,
                      }}
                    />
                    <em style={{ left: `${(g.median / max) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
