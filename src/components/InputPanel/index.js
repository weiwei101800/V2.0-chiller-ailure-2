// ───────────────────────────────────────────────────────────
// InputPanel/index.js  –  Alpha‑4 (adds Room Air + Block‑4 toggle)
// ───────────────────────────────────────────────────────────
import React from "react";
import {
  Form,
  InputNumber,
  Button,
  Divider,
  Space,
  Typography,
  Alert,
  Checkbox,
} from "antd";

const { Text } = Typography;

export default function InputPanel({ onSubmit }) {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit?.(values);
  };

  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          enableBlock4: true,

          // 通用
          Q_total: 3850,
          T_sup: 17,
          T_env: 46,
          ratio_liquid: 80,

          // 台数
          FWU_Units: 8,
          CDU_Units: 4,

          // Flow
          flowA_LPM: 324,
          flowL_LPM: 1200,
          flowA_ref_LPM: 324,
          n_w_A: 0.7,

          // Lumped fallback
          m_liquid: 120,
          m_air: 100,
          m_pipe: 60,

          // UA per unit
          UA_L_input: 32000,
          UA_A_ref: 26000,
          fan_flow_ref: 10,
          fan_flow: 10,
          n_exp: 0.8,

          // Pipe / Insulation
          L_pipe: 30,
          D_pipe: 0.1,
          t_ins: 0.05,
          k_ins: 0.035,
          h_ext: 5,
          f_env: 1,
          A_pipe: 5,

          // Heat capacity detail per unit
          Cp_H2O: 4.18,
          Cp_Cu: 0.39,
          Cp_Al: 0.91,
          M_Cu_coil: 83,
          M_Al_coil: 66,
          M_H2O_coil: 78,
          M_Cu_TCS: 200,
          M_Al_TCS: 200,
          M_H2O_TCS: 200,

          // Volumes
          V_tank: 3200,
          V_evaporation: 0,
          V_pipe_internal: 5000,
          V_pipe_external: 1000,

          // Room air
          T_room_init: 25,
          V_room_m3: 1317.84,
          UA_room: 0,
        }}
      >
        {/* Block-4 toggle */}
        <Form.Item name="enableBlock4" valuePropName="checked">
          <Checkbox>启用 Block‑4（含机房空气节点）</Checkbox>
        </Form.Item>

        <Divider />

        {/* 通用 */}
        <h3>通用参数</h3>
        <Form.Item label="IT热负荷 Q_total (kW)" name="Q_total">
          <InputNumber min={0} step={10} style={{ width: "100%" }} />
        </Form.Item>
        <Space size="middle" wrap>
          <Form.Item label="初始供水温度 T_sup (°C)" name="T_sup">
            <InputNumber step={0.5} />
          </Form.Item>
          <Form.Item label="环境温度 T_env (°C)" name="T_env">
            <InputNumber step={0.5} />
          </Form.Item>
        </Space>
        <Form.Item
          label="液冷分担比 ratioLiquid (%)"
          name="ratio_liquid"
          tooltip="IT热负荷中经液冷侧的百分比；剩余走空气侧。"
        >
          <InputNumber min={0} max={100} step={5} style={{ width: "100%" }} />
        </Form.Item>

        <Divider />

        {/* 台数 */}
        <h3>设备台数</h3>
        <Space size="middle" wrap>
          <Form.Item label="FWU 台数" name="FWU_Units">
            <InputNumber min={1} step={1} />
          </Form.Item>
          <Form.Item label="CDU 台数" name="CDU_Units">
            <InputNumber min={1} step={1} />
          </Form.Item>
        </Space>

        <Divider />

        {/* Flow */}
        <h3>回路流量 (LPM)</h3>
        <Space size="middle" wrap>
          <Form.Item
            label="风冷回路 flowA_LPM"
            name="flowA_LPM"
            tooltip="FWU 总循环水流量 (LPM)."
          >
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item
            label="液冷回路 flowL_LPM"
            name="flowL_LPM"
            tooltip="CDU/TCS 总循环水流量 (LPM)."
          >
            <InputNumber min={0} step={10} />
          </Form.Item>
        </Space>
        <Space size="middle" wrap>
          <Form.Item
            label="风冷额定流量 flowA_ref_LPM"
            name="flowA_ref_LPM"
            tooltip="用于UA_A水侧缩放；若与当前相同可不改。"
          >
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item
            label="水侧UA缩放指数 n_w_A"
            name="n_w_A"
            tooltip="UA ∝ (flow/flow_ref)^n；默认0.7"
          >
            <InputNumber min={0} max={2} step={0.1} />
          </Form.Item>
        </Space>

        <Divider />

        {/* Lumped fallback */}
        <h3>系统热容 (kg)（回退用）</h3>
        <Space size="middle">
          <Form.Item label="液冷 m_liquid" name="m_liquid">
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item label="风冷 m_air" name="m_air">
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item label="管段 m_pipe" name="m_pipe">
            <InputNumber min={0} step={10} />
          </Form.Item>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          若填写了详细质量 & 体积，本区将被覆盖。
        </Text>

        <Divider />

        {/* UA per unit */}
        <h3>UA 参数（单台）</h3>
        <Alert
          type="info"
          showIcon
          message="以下 UA 输入为单台；总UA=单台×台数；Block‑4可结合流量缩放。"
          style={{ marginBottom: 16 }}
        />
        <Form.Item label="液冷盘管 UA_L /台 (W/K)" name="UA_L_input">
          <InputNumber min={0} step={100} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="风冷盘管 UA_A_ref /台 (W/K)" name="UA_A_ref">
          <InputNumber min={0} step={100} style={{ width: "100%" }} />
        </Form.Item>
        <Space size="middle" wrap>
          <Form.Item label="n_exp (legacy)" name="n_exp">
            <InputNumber min={0} max={2} step={0.1} />
          </Form.Item>
          <Form.Item label="fan_flow_ref (legacy)" name="fan_flow_ref">
            <InputNumber min={0} step={0.5} />
          </Form.Item>
          <Form.Item label="fan_flow (legacy)" name="fan_flow">
            <InputNumber min={0} step={0.5} />
          </Form.Item>
        </Space>

        <Divider />

        {/* Pipe / Insulation */}
        <h3>外露管段 / 保温</h3>
        <Space size="middle" wrap>
          <Form.Item label="外露长度 L_pipe (m)" name="L_pipe">
            <InputNumber min={0} step={1} />
          </Form.Item>
          <Form.Item label="外径 D_pipe (m)" name="D_pipe">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item label="保温厚 t_ins (m)" name="t_ins">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
        </Space>
        <Space size="middle" wrap>
          <Form.Item label="保温导热 k_ins (W/m·K)" name="k_ins">
            <InputNumber min={0} step={0.005} />
          </Form.Item>
          <Form.Item label="外侧 h_ext (W/m²·K)" name="h_ext">
            <InputNumber min={0} step={1} />
          </Form.Item>
          <Form.Item label="环境修正 f_env" name="f_env">
            <InputNumber min={0} max={5} step={0.1} />
          </Form.Item>
        </Space>
        <Form.Item
          label="暴露总面积 A_pipe (m²)"
          name="A_pipe"
          tooltip="若无长度/外径，用面积估算 UA_P。"
        >
          <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
        </Form.Item>

        <Divider />

        {/* Heat capacity detail per unit */}
        <h3>热容细化 – 比热 (kJ/kg·°C)</h3>
        <Space size="middle" wrap>
          <Form.Item label="Cp_H2O" name="Cp_H2O">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item label="Cp_Cu" name="Cp_Cu">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item label="Cp_Al" name="Cp_Al">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
        </Space>

        <h4>FWU 单台质量 (kg)</h4>
        <Space size="middle" wrap>
          <Form.Item label="M_Cu_coil" name="M_Cu_coil">
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item label="M_Al_coil" name="M_Al_coil">
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item label="M_H2O_coil" name="M_H2O_coil">
            <InputNumber min={0} step={10} />
          </Form.Item>
        </Space>

        <h4>CDU / TCS 单台质量 (kg)</h4>
        <Space size="middle" wrap>
          <Form.Item label="M_Cu_TCS" name="M_Cu_TCS">
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item label="M_Al_TCS" name="M_Al_TCS">
            <InputNumber min={0} step={10} />
          </Form.Item>
          <Form.Item label="M_H2O_TCS" name="M_H2O_TCS">
            <InputNumber min={0} step={10} />
          </Form.Item>
        </Space>

        <Divider />

        {/* Volumes */}
        <h3>系统水量 (L)</h3>
        <Space size="middle" wrap>
          <Form.Item label="V_tank" name="V_tank">
            <InputNumber min={0} step={0.1} />
          </Form.Item>
          <Form.Item label="V_evaporation" name="V_evaporation">
            <InputNumber min={0} step={0.1} />
          </Form.Item>
        </Space>
        <Space size="middle" wrap>
          <Form.Item label="V_pipe_internal" name="V_pipe_internal">
            <InputNumber min={0} step={0.1} />
          </Form.Item>
          <Form.Item label="V_pipe_external" name="V_pipe_external">
            <InputNumber min={0} step={0.1} />
          </Form.Item>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          冷库热容 = tank + evap + pipe_internal + pipe_external。
          外露段还与环境换热 (UA_P)。
        </Text>

        <Divider />

        {/* Room Air */}
        <h3>机房空气节点</h3>
        <Space size="middle" wrap>
          <Form.Item label="T_room_init (°C)" name="T_room_init">
            <InputNumber step={0.5} />
          </Form.Item>
          <Form.Item label="V_room_m3 (m³)" name="V_room_m3">
            <InputNumber min={0} step={1} />
          </Form.Item>
          <Form.Item
            label="UA_room (W/K)"
            name="UA_room"
            tooltip="机房空气对外壳体散热；暂不考虑可留0。"
          >
            <InputNumber min={0} step={100} />
          </Form.Item>
        </Space>

        <Divider />

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            运行计算
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
