--
-- PostgreSQL database dump
--

\restrict h7JjFpQ9aKGrvdDGVAprtuBoV7CRTGs4aiW3CGEWJXqUBdt6VbuoL58AOHiXuFA

-- Dumped from database version 18.4 (Homebrew)
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: karyawan_reset_password_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.karyawan_reset_password_status_enum AS ENUM (
    'none',
    'pending',
    'approved'
);


ALTER TYPE public.karyawan_reset_password_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: absensi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.absensi (
    id_absensi integer NOT NULL,
    id_karyawan integer NOT NULL,
    id_jadwal integer,
    id_izin integer,
    id_kantor integer,
    jam_masuk_aktual timestamp without time zone,
    jam_keluar_aktual timestamp without time zone,
    lokasi_lat numeric(10,7),
    lokasi_lng numeric(10,7),
    dalam_radius_kantor boolean,
    status_kehadiran character varying,
    metode_absen character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.absensi OWNER TO postgres;

--
-- Name: absensi_id_absensi_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.absensi_id_absensi_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.absensi_id_absensi_seq OWNER TO postgres;

--
-- Name: absensi_id_absensi_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.absensi_id_absensi_seq OWNED BY public.absensi.id_absensi;


--
-- Name: departemen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departemen (
    id_departemen integer NOT NULL,
    nama_departemen character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    id_pengelola integer
);


ALTER TABLE public.departemen OWNER TO postgres;

--
-- Name: departemen_id_departemen_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departemen_id_departemen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departemen_id_departemen_seq OWNER TO postgres;

--
-- Name: departemen_id_departemen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departemen_id_departemen_seq OWNED BY public.departemen.id_departemen;


--
-- Name: departemen_pengelola; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departemen_pengelola (
    id_departemen integer NOT NULL,
    id_user integer NOT NULL
);


ALTER TABLE public.departemen_pengelola OWNER TO postgres;

--
-- Name: hari_libur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hari_libur (
    id_hari_libur integer NOT NULL,
    nama character varying NOT NULL,
    tanggal date NOT NULL,
    keterangan text,
    is_libur boolean DEFAULT true NOT NULL,
    id_user integer,
    id_shift integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hari_libur OWNER TO postgres;

--
-- Name: hari_libur_id_hari_libur_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hari_libur_id_hari_libur_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hari_libur_id_hari_libur_seq OWNER TO postgres;

--
-- Name: hari_libur_id_hari_libur_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hari_libur_id_hari_libur_seq OWNED BY public.hari_libur.id_hari_libur;


--
-- Name: istirahat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.istirahat (
    id_istirahat integer NOT NULL,
    id_absensi integer NOT NULL,
    jam_keluar_istirahat timestamp without time zone,
    jam_masuk_istirahat timestamp without time zone,
    durasi_menit integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.istirahat OWNER TO postgres;

--
-- Name: istirahat_id_istirahat_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.istirahat_id_istirahat_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.istirahat_id_istirahat_seq OWNER TO postgres;

--
-- Name: istirahat_id_istirahat_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.istirahat_id_istirahat_seq OWNED BY public.istirahat.id_istirahat;


--
-- Name: jabatan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jabatan (
    id_jabatan integer NOT NULL,
    nama_jabatan character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.jabatan OWNER TO postgres;

--
-- Name: jabatan_id_jabatan_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jabatan_id_jabatan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jabatan_id_jabatan_seq OWNER TO postgres;

--
-- Name: jabatan_id_jabatan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jabatan_id_jabatan_seq OWNED BY public.jabatan.id_jabatan;


--
-- Name: jadwal_kerja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jadwal_kerja (
    id_jadwal integer NOT NULL,
    id_karyawan integer NOT NULL,
    id_shift integer,
    is_cuti boolean DEFAULT false NOT NULL,
    id_user integer,
    tanggal date NOT NULL,
    sumber_upload character varying DEFAULT 'manual'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_libur boolean DEFAULT false NOT NULL,
    keterangan character varying
);


ALTER TABLE public.jadwal_kerja OWNER TO postgres;

--
-- Name: jadwal_kerja_id_jadwal_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jadwal_kerja_id_jadwal_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jadwal_kerja_id_jadwal_seq OWNER TO postgres;

--
-- Name: jadwal_kerja_id_jadwal_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jadwal_kerja_id_jadwal_seq OWNED BY public.jadwal_kerja.id_jadwal;


--
-- Name: karyawan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.karyawan (
    id_karyawan integer NOT NULL,
    nik character varying NOT NULL,
    nama character varying NOT NULL,
    id_departemen integer,
    id_jabatan integer,
    tanggal_masuk date,
    status_aktif character varying DEFAULT 'aktif'::character varying NOT NULL,
    username character varying,
    password character varying,
    email character varying,
    nomor_telepon character varying,
    email_terverifikasi boolean DEFAULT false NOT NULL,
    token character varying,
    token_kadaluarsa timestamp without time zone,
    otp_code character varying(6),
    otp_kadaluarsa timestamp without time zone,
    foto_wajah_referensi text,
    face_embedding public.vector(512),
    gaji_pokok numeric(15,2),
    hak_cuti boolean DEFAULT false NOT NULL,
    hari_libur character varying,
    foto_profil character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    jenis_kelamin character varying(20),
    no_rekening character varying(34),
    nama_bank character varying(50),
    tunjangan_konsumsi_hari numeric(15,2) DEFAULT '20000'::numeric,
    tunjangan_transportasi numeric(15,2) DEFAULT '0'::numeric,
    tunjangan_komunikasi numeric(15,2) DEFAULT '0'::numeric,
    tunjangan_jabatan numeric(15,2) DEFAULT '0'::numeric,
    potongan_bpjs numeric(15,2) DEFAULT '0'::numeric,
    reset_password_status public.karyawan_reset_password_status_enum DEFAULT 'none'::public.karyawan_reset_password_status_enum NOT NULL
);


ALTER TABLE public.karyawan OWNER TO postgres;

--
-- Name: karyawan_id_karyawan_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.karyawan_id_karyawan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.karyawan_id_karyawan_seq OWNER TO postgres;

--
-- Name: karyawan_id_karyawan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.karyawan_id_karyawan_seq OWNED BY public.karyawan.id_karyawan;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id_notification integer NOT NULL,
    id_user integer,
    id_karyawan integer,
    title character varying NOT NULL,
    message text NOT NULL,
    type character varying DEFAULT 'SYSTEM'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: notification_id_notification_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_id_notification_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_id_notification_seq OWNER TO postgres;

--
-- Name: notification_id_notification_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_id_notification_seq OWNED BY public.notification.id_notification;


--
-- Name: peminjaman_aset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.peminjaman_aset (
    id_peminjaman_aset integer NOT NULL,
    id_karyawan integer NOT NULL,
    kode_barang character varying(50) NOT NULL,
    nama_barang character varying NOT NULL,
    tanggal_pinjam date NOT NULL,
    durasi character varying(100) NOT NULL,
    keterangan text,
    status character varying(20) DEFAULT 'dipinjam'::character varying NOT NULL,
    tanggal_dikembalikan date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.peminjaman_aset OWNER TO postgres;

--
-- Name: peminjaman_aset_id_peminjaman_aset_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.peminjaman_aset_id_peminjaman_aset_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.peminjaman_aset_id_peminjaman_aset_seq OWNER TO postgres;

--
-- Name: peminjaman_aset_id_peminjaman_aset_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.peminjaman_aset_id_peminjaman_aset_seq OWNED BY public.peminjaman_aset.id_peminjaman_aset;


--
-- Name: pengajuan_izin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengajuan_izin (
    id_izin integer NOT NULL,
    id_karyawan integer NOT NULL,
    jenis_izin character varying NOT NULL,
    tanggal_mulai date NOT NULL,
    tanggal_selesai date NOT NULL,
    alasan character varying NOT NULL,
    file_pendukung character varying,
    menggunakan_lokasi boolean DEFAULT false NOT NULL,
    lokasi_lat numeric(10,7),
    lokasi_lng numeric(10,7),
    dalam_radius_kantor boolean,
    status character varying DEFAULT 'menunggu'::character varying NOT NULL,
    id_user_approval integer,
    tanggal_pengajuan timestamp without time zone NOT NULL,
    tanggal_diproses timestamp without time zone,
    catatan_approval character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    jam_mulai character varying(5),
    jam_selesai character varying(5),
    id_user_spv integer,
    catatan_spv text,
    id_user_hrd integer,
    catatan_hrd text
);


ALTER TABLE public.pengajuan_izin OWNER TO postgres;

--
-- Name: pengajuan_izin_id_izin_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengajuan_izin_id_izin_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengajuan_izin_id_izin_seq OWNER TO postgres;

--
-- Name: pengajuan_izin_id_izin_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengajuan_izin_id_izin_seq OWNED BY public.pengajuan_izin.id_izin;


--
-- Name: pengajuan_pertukaran; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengajuan_pertukaran (
    id_pertukaran integer NOT NULL,
    id_karyawan_pemohon integer NOT NULL,
    id_karyawan_target integer NOT NULL,
    jenis_pertukaran character varying(20) NOT NULL,
    tanggal_pemohon date NOT NULL,
    id_shift_pemohon integer,
    tanggal_target date NOT NULL,
    id_shift_target integer,
    alasan text,
    status character varying(30) DEFAULT 'menunggu_rekan'::character varying NOT NULL,
    catatan_rekan text,
    id_user_spv integer,
    catatan_spv text,
    id_user_hrd integer,
    catatan_hrd text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pengajuan_pertukaran OWNER TO postgres;

--
-- Name: pengajuan_pertukaran_id_pertukaran_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengajuan_pertukaran_id_pertukaran_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengajuan_pertukaran_id_pertukaran_seq OWNER TO postgres;

--
-- Name: pengajuan_pertukaran_id_pertukaran_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengajuan_pertukaran_id_pertukaran_seq OWNED BY public.pengajuan_pertukaran.id_pertukaran;


--
-- Name: pengajuan_ro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengajuan_ro (
    id_pengajuan_ro integer NOT NULL,
    id_karyawan integer NOT NULL,
    tanggal_dipilih text NOT NULL,
    jumlah_hari integer NOT NULL,
    alasan text,
    status character varying(30) DEFAULT 'menunggu_spv'::character varying NOT NULL,
    id_user_spv integer,
    catatan_spv text,
    tanggal_approval_spv timestamp without time zone,
    id_user_hrd integer,
    catatan_hrd text,
    tanggal_approval_hrd timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pengajuan_ro OWNER TO postgres;

--
-- Name: pengajuan_ro_id_pengajuan_ro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengajuan_ro_id_pengajuan_ro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengajuan_ro_id_pengajuan_ro_seq OWNER TO postgres;

--
-- Name: pengajuan_ro_id_pengajuan_ro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengajuan_ro_id_pengajuan_ro_seq OWNED BY public.pengajuan_ro.id_pengajuan_ro;


--
-- Name: pengajuan_tunda_off; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengajuan_tunda_off (
    id_tunda_off integer NOT NULL,
    id_karyawan integer NOT NULL,
    tanggal_off_asal date NOT NULL,
    tanggal_off_baru date NOT NULL,
    alasan text NOT NULL,
    status character varying(30) DEFAULT 'menunggu_spv'::character varying NOT NULL,
    id_user_spv integer,
    catatan_spv text,
    tanggal_approval_spv timestamp without time zone,
    id_user_hrd integer,
    catatan_hrd text,
    tanggal_approval_hrd timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pengajuan_tunda_off OWNER TO postgres;

--
-- Name: pengajuan_tunda_off_id_tunda_off_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengajuan_tunda_off_id_tunda_off_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengajuan_tunda_off_id_tunda_off_seq OWNER TO postgres;

--
-- Name: pengajuan_tunda_off_id_tunda_off_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengajuan_tunda_off_id_tunda_off_seq OWNED BY public.pengajuan_tunda_off.id_tunda_off;


--
-- Name: pengaturan_kantor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengaturan_kantor (
    id_kantor integer NOT NULL,
    nama_kantor character varying NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    radius_meter integer NOT NULL,
    id_departemen integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pengaturan_kantor OWNER TO postgres;

--
-- Name: pengaturan_kantor_id_kantor_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengaturan_kantor_id_kantor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengaturan_kantor_id_kantor_seq OWNER TO postgres;

--
-- Name: pengaturan_kantor_id_kantor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengaturan_kantor_id_kantor_seq OWNED BY public.pengaturan_kantor.id_kantor;


--
-- Name: pengaturan_penggajian; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengaturan_penggajian (
    id integer NOT NULL,
    tanggal_cut_off_mulai integer DEFAULT 25 NOT NULL,
    tanggal_cut_off_selesai integer DEFAULT 24 NOT NULL,
    denda_per_telat_default numeric(12,2) DEFAULT '20000'::numeric NOT NULL,
    standar_hari_kerja integer DEFAULT 26 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pengaturan_penggajian OWNER TO postgres;

--
-- Name: pengaturan_penggajian_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengaturan_penggajian_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengaturan_penggajian_id_seq OWNER TO postgres;

--
-- Name: pengaturan_penggajian_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengaturan_penggajian_id_seq OWNED BY public.pengaturan_penggajian.id;


--
-- Name: penggajian; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penggajian (
    id_gaji integer NOT NULL,
    id_karyawan integer NOT NULL,
    periode_awal date NOT NULL,
    periode_akhir date NOT NULL,
    total_jam_kerja integer DEFAULT 0 NOT NULL,
    gaji_pokok numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    potongan numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_gaji numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    tanggal_bayar date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    total_hari_kerja integer DEFAULT 26 NOT NULL,
    total_hari_hadir integer DEFAULT 0 NOT NULL,
    gaji_pokok_sesuai_hari numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    tarif_konsumsi_per_hari numeric(15,2) DEFAULT '20000'::numeric NOT NULL,
    tunjangan_konsumsi numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    tunjangan_transportasi numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    tunjangan_komunikasi numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    tunjangan_jabatan numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    lembur numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    total_penghasilan numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    potongan_bpjs numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    potongan_terlambat numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    potongan_pinjaman numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    potongan_lainnya numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    sisa_pinjaman numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    catatan text
);


ALTER TABLE public.penggajian OWNER TO postgres;

--
-- Name: penggajian_id_gaji_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penggajian_id_gaji_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penggajian_id_gaji_seq OWNER TO postgres;

--
-- Name: penggajian_id_gaji_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penggajian_id_gaji_seq OWNED BY public.penggajian.id_gaji;


--
-- Name: saldo_ro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saldo_ro (
    id_saldo_ro integer NOT NULL,
    id_karyawan integer NOT NULL,
    id_hari_libur integer,
    tanggal_libur_nasional date NOT NULL,
    nama_hari_libur character varying(255) NOT NULL,
    tanggal_perolehan date NOT NULL,
    tanggal_kadaluarsa date NOT NULL,
    status character varying(20) DEFAULT 'tersedia'::character varying NOT NULL,
    id_pengajuan_ro integer,
    keterangan text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.saldo_ro OWNER TO postgres;

--
-- Name: saldo_ro_id_saldo_ro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saldo_ro_id_saldo_ro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saldo_ro_id_saldo_ro_seq OWNER TO postgres;

--
-- Name: saldo_ro_id_saldo_ro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saldo_ro_id_saldo_ro_seq OWNED BY public.saldo_ro.id_saldo_ro;


--
-- Name: shift; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift (
    id_shift integer NOT NULL,
    id_departemen integer,
    nama_shift character varying NOT NULL,
    jam_mulai time without time zone NOT NULL,
    jam_selesai time without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shift OWNER TO postgres;

--
-- Name: shift_id_shift_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_id_shift_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_id_shift_seq OWNER TO postgres;

--
-- Name: shift_id_shift_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_id_shift_seq OWNED BY public.shift.id_shift;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id_user integer NOT NULL,
    nama character varying NOT NULL,
    role character varying NOT NULL,
    username character varying NOT NULL,
    foto_profil text,
    id_departemen integer,
    password character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_user_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_user_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_user_seq OWNER TO postgres;

--
-- Name: user_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_user_seq OWNED BY public."user".id_user;


--
-- Name: absensi id_absensi; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi ALTER COLUMN id_absensi SET DEFAULT nextval('public.absensi_id_absensi_seq'::regclass);


--
-- Name: departemen id_departemen; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departemen ALTER COLUMN id_departemen SET DEFAULT nextval('public.departemen_id_departemen_seq'::regclass);


--
-- Name: hari_libur id_hari_libur; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hari_libur ALTER COLUMN id_hari_libur SET DEFAULT nextval('public.hari_libur_id_hari_libur_seq'::regclass);


--
-- Name: istirahat id_istirahat; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.istirahat ALTER COLUMN id_istirahat SET DEFAULT nextval('public.istirahat_id_istirahat_seq'::regclass);


--
-- Name: jabatan id_jabatan; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jabatan ALTER COLUMN id_jabatan SET DEFAULT nextval('public.jabatan_id_jabatan_seq'::regclass);


--
-- Name: jadwal_kerja id_jadwal; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal_kerja ALTER COLUMN id_jadwal SET DEFAULT nextval('public.jadwal_kerja_id_jadwal_seq'::regclass);


--
-- Name: karyawan id_karyawan; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karyawan ALTER COLUMN id_karyawan SET DEFAULT nextval('public.karyawan_id_karyawan_seq'::regclass);


--
-- Name: notification id_notification; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification ALTER COLUMN id_notification SET DEFAULT nextval('public.notification_id_notification_seq'::regclass);


--
-- Name: peminjaman_aset id_peminjaman_aset; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman_aset ALTER COLUMN id_peminjaman_aset SET DEFAULT nextval('public.peminjaman_aset_id_peminjaman_aset_seq'::regclass);


--
-- Name: pengajuan_izin id_izin; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_izin ALTER COLUMN id_izin SET DEFAULT nextval('public.pengajuan_izin_id_izin_seq'::regclass);


--
-- Name: pengajuan_pertukaran id_pertukaran; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran ALTER COLUMN id_pertukaran SET DEFAULT nextval('public.pengajuan_pertukaran_id_pertukaran_seq'::regclass);


--
-- Name: pengajuan_ro id_pengajuan_ro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_ro ALTER COLUMN id_pengajuan_ro SET DEFAULT nextval('public.pengajuan_ro_id_pengajuan_ro_seq'::regclass);


--
-- Name: pengajuan_tunda_off id_tunda_off; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_tunda_off ALTER COLUMN id_tunda_off SET DEFAULT nextval('public.pengajuan_tunda_off_id_tunda_off_seq'::regclass);


--
-- Name: pengaturan_kantor id_kantor; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengaturan_kantor ALTER COLUMN id_kantor SET DEFAULT nextval('public.pengaturan_kantor_id_kantor_seq'::regclass);


--
-- Name: pengaturan_penggajian id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengaturan_penggajian ALTER COLUMN id SET DEFAULT nextval('public.pengaturan_penggajian_id_seq'::regclass);


--
-- Name: penggajian id_gaji; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penggajian ALTER COLUMN id_gaji SET DEFAULT nextval('public.penggajian_id_gaji_seq'::regclass);


--
-- Name: saldo_ro id_saldo_ro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saldo_ro ALTER COLUMN id_saldo_ro SET DEFAULT nextval('public.saldo_ro_id_saldo_ro_seq'::regclass);


--
-- Name: shift id_shift; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift ALTER COLUMN id_shift SET DEFAULT nextval('public.shift_id_shift_seq'::regclass);


--
-- Name: user id_user; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id_user SET DEFAULT nextval('public.user_id_user_seq'::regclass);


--
-- Data for Name: absensi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.absensi (id_absensi, id_karyawan, id_jadwal, id_izin, id_kantor, jam_masuk_aktual, jam_keluar_aktual, lokasi_lat, lokasi_lng, dalam_radius_kantor, status_kehadiran, metode_absen, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departemen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departemen (id_departemen, nama_departemen, created_at, updated_at, id_pengelola) FROM stdin;
\.


--
-- Data for Name: departemen_pengelola; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departemen_pengelola (id_departemen, id_user) FROM stdin;
\.


--
-- Data for Name: hari_libur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hari_libur (id_hari_libur, nama, tanggal, keterangan, is_libur, id_user, id_shift, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: istirahat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.istirahat (id_istirahat, id_absensi, jam_keluar_istirahat, jam_masuk_istirahat, durasi_menit, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jabatan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jabatan (id_jabatan, nama_jabatan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jadwal_kerja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jadwal_kerja (id_jadwal, id_karyawan, id_shift, is_cuti, id_user, tanggal, sumber_upload, created_at, updated_at, is_libur, keterangan) FROM stdin;
\.


--
-- Data for Name: karyawan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.karyawan (id_karyawan, nik, nama, id_departemen, id_jabatan, tanggal_masuk, status_aktif, username, password, email, nomor_telepon, email_terverifikasi, token, token_kadaluarsa, otp_code, otp_kadaluarsa, foto_wajah_referensi, face_embedding, gaji_pokok, hak_cuti, hari_libur, foto_profil, created_at, updated_at, jenis_kelamin, no_rekening, nama_bank, tunjangan_konsumsi_hari, tunjangan_transportasi, tunjangan_komunikasi, tunjangan_jabatan, potongan_bpjs, reset_password_status) FROM stdin;
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (id_notification, id_user, id_karyawan, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: peminjaman_aset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.peminjaman_aset (id_peminjaman_aset, id_karyawan, kode_barang, nama_barang, tanggal_pinjam, durasi, keterangan, status, tanggal_dikembalikan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pengajuan_izin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengajuan_izin (id_izin, id_karyawan, jenis_izin, tanggal_mulai, tanggal_selesai, alasan, file_pendukung, menggunakan_lokasi, lokasi_lat, lokasi_lng, dalam_radius_kantor, status, id_user_approval, tanggal_pengajuan, tanggal_diproses, catatan_approval, created_at, updated_at, jam_mulai, jam_selesai, id_user_spv, catatan_spv, id_user_hrd, catatan_hrd) FROM stdin;
\.


--
-- Data for Name: pengajuan_pertukaran; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengajuan_pertukaran (id_pertukaran, id_karyawan_pemohon, id_karyawan_target, jenis_pertukaran, tanggal_pemohon, id_shift_pemohon, tanggal_target, id_shift_target, alasan, status, catatan_rekan, id_user_spv, catatan_spv, id_user_hrd, catatan_hrd, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pengajuan_ro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengajuan_ro (id_pengajuan_ro, id_karyawan, tanggal_dipilih, jumlah_hari, alasan, status, id_user_spv, catatan_spv, tanggal_approval_spv, id_user_hrd, catatan_hrd, tanggal_approval_hrd, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pengajuan_tunda_off; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengajuan_tunda_off (id_tunda_off, id_karyawan, tanggal_off_asal, tanggal_off_baru, alasan, status, id_user_spv, catatan_spv, tanggal_approval_spv, id_user_hrd, catatan_hrd, tanggal_approval_hrd, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pengaturan_kantor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengaturan_kantor (id_kantor, nama_kantor, latitude, longitude, radius_meter, id_departemen, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pengaturan_penggajian; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengaturan_penggajian (id, tanggal_cut_off_mulai, tanggal_cut_off_selesai, denda_per_telat_default, standar_hari_kerja, updated_at) FROM stdin;
\.


--
-- Data for Name: penggajian; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penggajian (id_gaji, id_karyawan, periode_awal, periode_akhir, total_jam_kerja, gaji_pokok, potongan, total_gaji, tanggal_bayar, created_at, updated_at, total_hari_kerja, total_hari_hadir, gaji_pokok_sesuai_hari, tarif_konsumsi_per_hari, tunjangan_konsumsi, tunjangan_transportasi, tunjangan_komunikasi, tunjangan_jabatan, lembur, total_penghasilan, potongan_bpjs, potongan_terlambat, potongan_pinjaman, potongan_lainnya, sisa_pinjaman, catatan) FROM stdin;
\.


--
-- Data for Name: saldo_ro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saldo_ro (id_saldo_ro, id_karyawan, id_hari_libur, tanggal_libur_nasional, nama_hari_libur, tanggal_perolehan, tanggal_kadaluarsa, status, id_pengajuan_ro, keterangan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shift; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift (id_shift, id_departemen, nama_shift, jam_mulai, jam_selesai, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id_user, nama, role, username, foto_profil, id_departemen, password, created_at, updated_at) FROM stdin;
1	Administrator	Admin	admin	\N	\N	$2b$10$p9.UPf84PbxeGSTVVht0C.8AYP7pa5pH2y6krcdnwYN6ghX5/jXRy	2026-09-08 00:20:19.046989	2026-09-08 00:20:19.046989
\.


--
-- Name: absensi_id_absensi_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.absensi_id_absensi_seq', 2, true);


--
-- Name: departemen_id_departemen_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departemen_id_departemen_seq', 1, false);


--
-- Name: hari_libur_id_hari_libur_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hari_libur_id_hari_libur_seq', 1, false);


--
-- Name: istirahat_id_istirahat_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.istirahat_id_istirahat_seq', 1, false);


--
-- Name: jabatan_id_jabatan_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jabatan_id_jabatan_seq', 1, false);


--
-- Name: jadwal_kerja_id_jadwal_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jadwal_kerja_id_jadwal_seq', 1, true);


--
-- Name: karyawan_id_karyawan_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.karyawan_id_karyawan_seq', 5, true);


--
-- Name: notification_id_notification_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_id_notification_seq', 1, false);


--
-- Name: peminjaman_aset_id_peminjaman_aset_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.peminjaman_aset_id_peminjaman_aset_seq', 1, false);


--
-- Name: pengajuan_izin_id_izin_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengajuan_izin_id_izin_seq', 1, false);


--
-- Name: pengajuan_pertukaran_id_pertukaran_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengajuan_pertukaran_id_pertukaran_seq', 1, false);


--
-- Name: pengajuan_ro_id_pengajuan_ro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengajuan_ro_id_pengajuan_ro_seq', 1, false);


--
-- Name: pengajuan_tunda_off_id_tunda_off_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengajuan_tunda_off_id_tunda_off_seq', 1, false);


--
-- Name: pengaturan_kantor_id_kantor_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengaturan_kantor_id_kantor_seq', 1, false);


--
-- Name: pengaturan_penggajian_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengaturan_penggajian_id_seq', 1, false);


--
-- Name: penggajian_id_gaji_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penggajian_id_gaji_seq', 6, true);


--
-- Name: saldo_ro_id_saldo_ro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saldo_ro_id_saldo_ro_seq', 1, false);


--
-- Name: shift_id_shift_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_id_shift_seq', 1, false);


--
-- Name: user_id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_user_seq', 1, true);


--
-- Name: pengajuan_pertukaran PK_035575c5eff57eb372a423799f7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran
    ADD CONSTRAINT "PK_035575c5eff57eb372a423799f7" PRIMARY KEY (id_pertukaran);


--
-- Name: penggajian PK_08c8c63761a2bb431524689e477; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penggajian
    ADD CONSTRAINT "PK_08c8c63761a2bb431524689e477" PRIMARY KEY (id_gaji);


--
-- Name: absensi PK_19ddf1d6b5d2a6e2899df2cb95b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT "PK_19ddf1d6b5d2a6e2899df2cb95b" PRIMARY KEY (id_absensi);


--
-- Name: pengajuan_izin PK_2ead8f153b90c4cb8105beaca9e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_izin
    ADD CONSTRAINT "PK_2ead8f153b90c4cb8105beaca9e" PRIMARY KEY (id_izin);


--
-- Name: jabatan PK_3dc4e99c0b46228d308c9fa71e7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jabatan
    ADD CONSTRAINT "PK_3dc4e99c0b46228d308c9fa71e7" PRIMARY KEY (id_jabatan);


--
-- Name: jadwal_kerja PK_5913070a248730717f210765d06; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal_kerja
    ADD CONSTRAINT "PK_5913070a248730717f210765d06" PRIMARY KEY (id_jadwal);


--
-- Name: notification PK_5eeade67aa70b7db4a6bdd4dcd8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT "PK_5eeade67aa70b7db4a6bdd4dcd8" PRIMARY KEY (id_notification);


--
-- Name: departemen_pengelola PK_672af798d439739fb206aa74a0f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departemen_pengelola
    ADD CONSTRAINT "PK_672af798d439739fb206aa74a0f" PRIMARY KEY (id_departemen, id_user);


--
-- Name: saldo_ro PK_86de9c62215690831da8e2175b5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saldo_ro
    ADD CONSTRAINT "PK_86de9c62215690831da8e2175b5" PRIMARY KEY (id_saldo_ro);


--
-- Name: pengaturan_penggajian PK_904a04a153a559cf480be256326; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengaturan_penggajian
    ADD CONSTRAINT "PK_904a04a153a559cf480be256326" PRIMARY KEY (id);


--
-- Name: user PK_9664961c0264d34a3cf82b11700; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_9664961c0264d34a3cf82b11700" PRIMARY KEY (id_user);


--
-- Name: karyawan PK_96ae0fb53d8955dc4ac0aed1820; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karyawan
    ADD CONSTRAINT "PK_96ae0fb53d8955dc4ac0aed1820" PRIMARY KEY (id_karyawan);


--
-- Name: departemen PK_986aa5c693db5cb461a123585da; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departemen
    ADD CONSTRAINT "PK_986aa5c693db5cb461a123585da" PRIMARY KEY (id_departemen);


--
-- Name: pengaturan_kantor PK_abc9419a1d100f34d144262762e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengaturan_kantor
    ADD CONSTRAINT "PK_abc9419a1d100f34d144262762e" PRIMARY KEY (id_kantor);


--
-- Name: hari_libur PK_bc18daf0ef3a51cc2584de8b42e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hari_libur
    ADD CONSTRAINT "PK_bc18daf0ef3a51cc2584de8b42e" PRIMARY KEY (id_hari_libur);


--
-- Name: shift PK_bd52791dffd674601e5d7c8e4f8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift
    ADD CONSTRAINT "PK_bd52791dffd674601e5d7c8e4f8" PRIMARY KEY (id_shift);


--
-- Name: istirahat PK_c50dea49107dcad744fc945a9ea; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.istirahat
    ADD CONSTRAINT "PK_c50dea49107dcad744fc945a9ea" PRIMARY KEY (id_istirahat);


--
-- Name: peminjaman_aset PK_ce509f9ff44437833a87592b9fc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman_aset
    ADD CONSTRAINT "PK_ce509f9ff44437833a87592b9fc" PRIMARY KEY (id_peminjaman_aset);


--
-- Name: pengajuan_ro PK_e9be4110d1c0d1532b8e24acbfd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_ro
    ADD CONSTRAINT "PK_e9be4110d1c0d1532b8e24acbfd" PRIMARY KEY (id_pengajuan_ro);


--
-- Name: pengajuan_tunda_off PK_f96d6afc53b99bf82fe06a1d996; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_tunda_off
    ADD CONSTRAINT "PK_f96d6afc53b99bf82fe06a1d996" PRIMARY KEY (id_tunda_off);


--
-- Name: user UQ_78a916df40e02a9deb1c4b75edb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE (username);


--
-- Name: karyawan UQ_7ad750229ded77d885cea939837; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karyawan
    ADD CONSTRAINT "UQ_7ad750229ded77d885cea939837" UNIQUE (email);


--
-- Name: karyawan UQ_ccb8f569ea519967f158f247c40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karyawan
    ADD CONSTRAINT "UQ_ccb8f569ea519967f158f247c40" UNIQUE (nik);


--
-- Name: IDX_0f992638795dba1181b72ae521; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0f992638795dba1181b72ae521" ON public.saldo_ro USING btree (id_karyawan);


--
-- Name: IDX_76eadd41e0db1820794aac8875; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_76eadd41e0db1820794aac8875" ON public.pengajuan_tunda_off USING btree (id_karyawan);


--
-- Name: IDX_98cd9c4c41e2be87addd4c5c72; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_98cd9c4c41e2be87addd4c5c72" ON public.jadwal_kerja USING btree (id_karyawan, tanggal);


--
-- Name: IDX_a28f11a4c5f1975d4deb356885; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_a28f11a4c5f1975d4deb356885" ON public.hari_libur USING btree (tanggal);


--
-- Name: IDX_ac5654bc5e6a69231423491ecd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ac5654bc5e6a69231423491ecd" ON public.peminjaman_aset USING btree (id_karyawan);


--
-- Name: IDX_d1c1cb122ac9f3b9e0d9ff552d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d1c1cb122ac9f3b9e0d9ff552d" ON public.departemen_pengelola USING btree (id_user);


--
-- Name: IDX_e11d7fea93da842a9925171429; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e11d7fea93da842a9925171429" ON public.departemen_pengelola USING btree (id_departemen);


--
-- Name: IDX_f0db012563779faa89113bee65; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_f0db012563779faa89113bee65" ON public.pengajuan_ro USING btree (id_karyawan);


--
-- Name: karyawan FK_06534e96bf748e0ea95c8e25b19; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karyawan
    ADD CONSTRAINT "FK_06534e96bf748e0ea95c8e25b19" FOREIGN KEY (id_jabatan) REFERENCES public.jabatan(id_jabatan);


--
-- Name: saldo_ro FK_0f992638795dba1181b72ae5213; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saldo_ro
    ADD CONSTRAINT "FK_0f992638795dba1181b72ae5213" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: absensi FK_0fdb859893251a08596e62b0a8d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT "FK_0fdb859893251a08596e62b0a8d" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: pengajuan_tunda_off FK_130481fd855407628ef1c9d59e7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_tunda_off
    ADD CONSTRAINT "FK_130481fd855407628ef1c9d59e7" FOREIGN KEY (id_user_hrd) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: pengajuan_pertukaran FK_21cb29327a22c30d97d4153d201; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran
    ADD CONSTRAINT "FK_21cb29327a22c30d97d4153d201" FOREIGN KEY (id_karyawan_pemohon) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: karyawan FK_270075b637a5e9c34c0ba1fc101; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.karyawan
    ADD CONSTRAINT "FK_270075b637a5e9c34c0ba1fc101" FOREIGN KEY (id_departemen) REFERENCES public.departemen(id_departemen);


--
-- Name: absensi FK_3a3d3feb4a77692a38637e6ca30; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT "FK_3a3d3feb4a77692a38637e6ca30" FOREIGN KEY (id_izin) REFERENCES public.pengajuan_izin(id_izin) ON DELETE SET NULL;


--
-- Name: jadwal_kerja FK_48c3de69c163b4628a6b7be728a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal_kerja
    ADD CONSTRAINT "FK_48c3de69c163b4628a6b7be728a" FOREIGN KEY (id_user) REFERENCES public."user"(id_user);


--
-- Name: pengajuan_izin FK_53af47a0b91a4f516e2434936bc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_izin
    ADD CONSTRAINT "FK_53af47a0b91a4f516e2434936bc" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: user FK_56f539e9ba410ea6052901b32bb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_56f539e9ba410ea6052901b32bb" FOREIGN KEY (id_departemen) REFERENCES public.departemen(id_departemen) ON DELETE SET NULL;


--
-- Name: saldo_ro FK_60f651e52aa5214c0f12179766f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saldo_ro
    ADD CONSTRAINT "FK_60f651e52aa5214c0f12179766f" FOREIGN KEY (id_hari_libur) REFERENCES public.hari_libur(id_hari_libur) ON DELETE SET NULL;


--
-- Name: istirahat FK_67861e937e791a9da9bf0d75350; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.istirahat
    ADD CONSTRAINT "FK_67861e937e791a9da9bf0d75350" FOREIGN KEY (id_absensi) REFERENCES public.absensi(id_absensi) ON DELETE CASCADE;


--
-- Name: penggajian FK_6f72a4e95a22898d1860857372e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penggajian
    ADD CONSTRAINT "FK_6f72a4e95a22898d1860857372e" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: pengajuan_tunda_off FK_76eadd41e0db1820794aac88754; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_tunda_off
    ADD CONSTRAINT "FK_76eadd41e0db1820794aac88754" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: pengajuan_pertukaran FK_789b4fd752a668afcf5e8183164; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran
    ADD CONSTRAINT "FK_789b4fd752a668afcf5e8183164" FOREIGN KEY (id_karyawan_target) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: pengajuan_izin FK_89357587375d44f9433aa049e54; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_izin
    ADD CONSTRAINT "FK_89357587375d44f9433aa049e54" FOREIGN KEY (id_user_spv) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: jadwal_kerja FK_8b4cedc31910d3bb6653261f0fd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal_kerja
    ADD CONSTRAINT "FK_8b4cedc31910d3bb6653261f0fd" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: pengajuan_tunda_off FK_9049f1611ee13c1d8c201f85813; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_tunda_off
    ADD CONSTRAINT "FK_9049f1611ee13c1d8c201f85813" FOREIGN KEY (id_user_spv) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: pengajuan_pertukaran FK_90e5aa3e276653cec7d8cfaf6ad; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran
    ADD CONSTRAINT "FK_90e5aa3e276653cec7d8cfaf6ad" FOREIGN KEY (id_user_hrd) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: absensi FK_98d771ae7f236a57c415a4eebcc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT "FK_98d771ae7f236a57c415a4eebcc" FOREIGN KEY (id_kantor) REFERENCES public.pengaturan_kantor(id_kantor) ON DELETE SET NULL;


--
-- Name: pengajuan_pertukaran FK_98e77b17bdb7884cdd1a777ee04; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran
    ADD CONSTRAINT "FK_98e77b17bdb7884cdd1a777ee04" FOREIGN KEY (id_shift_pemohon) REFERENCES public.shift(id_shift) ON DELETE SET NULL;


--
-- Name: shift FK_9e12bb951b91d93ce3f29504cb3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift
    ADD CONSTRAINT "FK_9e12bb951b91d93ce3f29504cb3" FOREIGN KEY (id_departemen) REFERENCES public.departemen(id_departemen) ON DELETE SET NULL;


--
-- Name: pengajuan_ro FK_a18afb33e279b47c2dd5dd8f748; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_ro
    ADD CONSTRAINT "FK_a18afb33e279b47c2dd5dd8f748" FOREIGN KEY (id_user_hrd) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: peminjaman_aset FK_ac5654bc5e6a69231423491ecd5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.peminjaman_aset
    ADD CONSTRAINT "FK_ac5654bc5e6a69231423491ecd5" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: jadwal_kerja FK_ba64c0cacf9a38f914df45017b6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jadwal_kerja
    ADD CONSTRAINT "FK_ba64c0cacf9a38f914df45017b6" FOREIGN KEY (id_shift) REFERENCES public.shift(id_shift) ON DELETE SET NULL;


--
-- Name: pengajuan_izin FK_bbf11d62b070f13e1b05e8f4047; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_izin
    ADD CONSTRAINT "FK_bbf11d62b070f13e1b05e8f4047" FOREIGN KEY (id_user_hrd) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: absensi FK_bedc3159cd7817d2669199b6981; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT "FK_bedc3159cd7817d2669199b6981" FOREIGN KEY (id_jadwal) REFERENCES public.jadwal_kerja(id_jadwal) ON DELETE SET NULL;


--
-- Name: pengajuan_izin FK_c13d14c518d57cfe7eadf42d8b8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_izin
    ADD CONSTRAINT "FK_c13d14c518d57cfe7eadf42d8b8" FOREIGN KEY (id_user_approval) REFERENCES public."user"(id_user);


--
-- Name: saldo_ro FK_c405c42a9fadf20fb95112ec319; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saldo_ro
    ADD CONSTRAINT "FK_c405c42a9fadf20fb95112ec319" FOREIGN KEY (id_pengajuan_ro) REFERENCES public.pengajuan_ro(id_pengajuan_ro) ON DELETE SET NULL;


--
-- Name: pengajuan_ro FK_c5d9b2f5fa3b0629e744a154eef; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_ro
    ADD CONSTRAINT "FK_c5d9b2f5fa3b0629e744a154eef" FOREIGN KEY (id_user_spv) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: pengaturan_kantor FK_ceaeebbb1fd3fa44056bde83175; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengaturan_kantor
    ADD CONSTRAINT "FK_ceaeebbb1fd3fa44056bde83175" FOREIGN KEY (id_departemen) REFERENCES public.departemen(id_departemen);


--
-- Name: departemen_pengelola FK_d1c1cb122ac9f3b9e0d9ff552d9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departemen_pengelola
    ADD CONSTRAINT "FK_d1c1cb122ac9f3b9e0d9ff552d9" FOREIGN KEY (id_user) REFERENCES public."user"(id_user) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pengajuan_pertukaran FK_dc28b4f4585f125be5aa51bdee8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran
    ADD CONSTRAINT "FK_dc28b4f4585f125be5aa51bdee8" FOREIGN KEY (id_shift_target) REFERENCES public.shift(id_shift) ON DELETE SET NULL;


--
-- Name: departemen_pengelola FK_e11d7fea93da842a9925171429d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departemen_pengelola
    ADD CONSTRAINT "FK_e11d7fea93da842a9925171429d" FOREIGN KEY (id_departemen) REFERENCES public.departemen(id_departemen) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hari_libur FK_eb8ef4e3696820e357bd41a75c7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hari_libur
    ADD CONSTRAINT "FK_eb8ef4e3696820e357bd41a75c7" FOREIGN KEY (id_shift) REFERENCES public.shift(id_shift) ON DELETE SET NULL;


--
-- Name: pengajuan_ro FK_f0db012563779faa89113bee656; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_ro
    ADD CONSTRAINT "FK_f0db012563779faa89113bee656" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: pengajuan_pertukaran FK_f8cfe1d3603ac260f45f686ba94; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengajuan_pertukaran
    ADD CONSTRAINT "FK_f8cfe1d3603ac260f45f686ba94" FOREIGN KEY (id_user_spv) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- Name: notification FK_f949cb03343bfe68993b5c305ee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT "FK_f949cb03343bfe68993b5c305ee" FOREIGN KEY (id_karyawan) REFERENCES public.karyawan(id_karyawan) ON DELETE CASCADE;


--
-- Name: notification FK_faae232c811e023f462f7a1f7c5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT "FK_faae232c811e023f462f7a1f7c5" FOREIGN KEY (id_user) REFERENCES public."user"(id_user) ON DELETE CASCADE;


--
-- Name: hari_libur FK_fbfc25a96939bf51437b662c117; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hari_libur
    ADD CONSTRAINT "FK_fbfc25a96939bf51437b662c117" FOREIGN KEY (id_user) REFERENCES public."user"(id_user) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict h7JjFpQ9aKGrvdDGVAprtuBoV7CRTGs4aiW3CGEWJXqUBdt6VbuoL58AOHiXuFA

